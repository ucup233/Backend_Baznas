'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. BEFORE UPDATE TRIGGER FOR DISTRIBUSI
    await queryInterface.sequelize.query(`DROP TRIGGER IF EXISTS before_distribusi_update`);
    await queryInterface.sequelize.query(`
      CREATE TRIGGER before_distribusi_update
      BEFORE UPDATE ON distribusi
      FOR EACH ROW
      BEGIN
        /* Sync Snapshot data if mustahiq_id changes */
        IF NEW.mustahiq_id IS NOT NULL AND (OLD.mustahiq_id IS NULL OR NEW.mustahiq_id != OLD.mustahiq_id) THEN
          SET NEW.nrm              = (SELECT nrm              FROM mustahiq WHERE id = NEW.mustahiq_id);
          SET NEW.nama_mustahik    = (SELECT nama             FROM mustahiq WHERE id = NEW.mustahiq_id);
          SET NEW.nik              = (SELECT nik              FROM mustahiq WHERE id = NEW.mustahiq_id);
          SET NEW.alamat           = (SELECT alamat           FROM mustahiq WHERE id = NEW.mustahiq_id);
          SET NEW.kelurahan_id     = (SELECT kelurahan_id     FROM mustahiq WHERE id = NEW.mustahiq_id);
          SET NEW.kecamatan_id     = (SELECT kecamatan_id     FROM mustahiq WHERE id = NEW.mustahiq_id);
          SET NEW.asnaf_id         = (SELECT asnaf_id         FROM mustahiq WHERE id = NEW.mustahiq_id);
          SET NEW.no_hp            = (SELECT no_hp            FROM mustahiq WHERE id = NEW.mustahiq_id);
          
          IF NEW.kategori_mustahiq_id IS NULL THEN
            SET NEW.kategori_mustahiq_id = (SELECT kategori_mustahiq_id FROM mustahiq WHERE id = NEW.mustahiq_id);
          END IF;
        END IF;

        /* Auto-fill Bulan & Tahun if Tanggal changes OR if they are currently invalid/NULL (e.g. status changed to 'diterima') */
        IF NEW.tanggal IS NOT NULL THEN
          IF (OLD.tanggal IS NULL OR NEW.tanggal != OLD.tanggal) 
             OR (NEW.status = 'diterima' AND OLD.status != 'diterima')
             OR (NEW.tahun IS NULL OR NEW.bulan IS NULL)
             OR (NEW.tahun != YEAR(NEW.tanggal)) THEN
             
            SET NEW.bulan = CASE MONTH(NEW.tanggal)
              WHEN 1  THEN 'Januari'   WHEN 2  THEN 'Februari'
              WHEN 3  THEN 'Maret'     WHEN 4  THEN 'April'
              WHEN 5  THEN 'Mei'       WHEN 6  THEN 'Juni'
              WHEN 7  THEN 'Juli'      WHEN 8  THEN 'Agustus'
              WHEN 9  THEN 'September' WHEN 10 THEN 'Oktober'
              WHEN 11 THEN 'November'  WHEN 12 THEN 'Desember'
            END;
            SET NEW.tahun = YEAR(NEW.tanggal);
          END IF;
        END IF;
      END
    `);

    // 2. BEFORE UPDATE TRIGGER FOR PENERIMAAN
    await queryInterface.sequelize.query(`DROP TRIGGER IF EXISTS before_penerimaan_update`);
    await queryInterface.sequelize.query(`
      CREATE TRIGGER before_penerimaan_update
      BEFORE UPDATE ON penerimaan
      FOR EACH ROW
      BEGIN
        DECLARE v_nilai_amil DECIMAL(7,4) DEFAULT 0;

        /* Sync Snapshot data if muzakki_id changes */
        IF NEW.muzakki_id IS NOT NULL AND (OLD.muzakki_id IS NULL OR NEW.muzakki_id != OLD.muzakki_id) THEN
          SET NEW.npwz             = (SELECT npwz             FROM muzakki WHERE id = NEW.muzakki_id);
          SET NEW.nama_muzakki     = (SELECT nama             FROM muzakki WHERE id = NEW.muzakki_id);
          SET NEW.nik_muzakki      = (SELECT nik              FROM muzakki WHERE id = NEW.muzakki_id);
          SET NEW.no_hp_muzakki    = (SELECT no_hp            FROM muzakki WHERE id = NEW.muzakki_id);
          SET NEW.jenis_muzakki_id = (SELECT jenis_muzakki_id FROM muzakki WHERE id = NEW.muzakki_id);
          SET NEW.jenis_upz_id     = (SELECT jenis_upz_id     FROM muzakki WHERE id = NEW.muzakki_id);
        END IF;

        /* Recalculate Dana Amil & Dana Bersih if jumlah or persentase amil changes */
        IF (NEW.jumlah != OLD.jumlah) OR (NEW.persentase_amil_id != OLD.persentase_amil_id) THEN
          SELECT nilai INTO v_nilai_amil FROM ref_persentase_amil WHERE id = NEW.persentase_amil_id;
          SET NEW.dana_amil   = NEW.jumlah * v_nilai_amil;
          SET NEW.dana_bersih = NEW.jumlah - NEW.dana_amil;
        END IF;

        /* Auto-fill Bulan & Tahun whenever Tanggal changes or they are currently invalid/NULL */
        IF NEW.tanggal IS NOT NULL THEN
          IF (OLD.tanggal IS NULL OR NEW.tanggal != OLD.tanggal)
             OR (NEW.tahun IS NULL OR NEW.bulan IS NULL)
             OR (NEW.tahun != YEAR(NEW.tanggal)) THEN
             
            SET NEW.bulan = CASE MONTH(NEW.tanggal)
              WHEN 1  THEN 'Januari'   WHEN 2  THEN 'Februari'
              WHEN 3  THEN 'Maret'     WHEN 4  THEN 'April'
              WHEN 5  THEN 'Mei'       WHEN 6  THEN 'Juni'
              WHEN 7  THEN 'Juli'      WHEN 8  THEN 'Agustus'
              WHEN 9  THEN 'September' WHEN 10 THEN 'Oktober'
              WHEN 11 THEN 'November'  WHEN 12 THEN 'Desember'
            END;
            SET NEW.tahun = YEAR(NEW.tanggal);
          END IF;
        END IF;
      END
    `);

    // 3. FORCE DATA SYNC - DISTRIBUSI
    // Correcting ALL records where tahun/bulan doesn't match tanggal, or is NULL.
    await queryInterface.sequelize.query(`
      UPDATE distribusi 
      SET 
        bulan = CASE MONTH(tanggal)
          WHEN 1  THEN 'Januari'   WHEN 2  THEN 'Februari'
          WHEN 3  THEN 'Maret'     WHEN 4  THEN 'April'
          WHEN 5  THEN 'Mei'       WHEN 6  THEN 'Juni'
          WHEN 7  THEN 'Juli'      WHEN 8  THEN 'Agustus'
          WHEN 9  THEN 'September' WHEN 10 THEN 'Oktober'
          WHEN 11 THEN 'November'  WHEN 12 THEN 'Desember'
        END,
        tahun = YEAR(tanggal)
      WHERE tanggal IS NOT NULL;
    `);

    // 4. FORCE DATA SYNC - PENERIMAAN
    await queryInterface.sequelize.query(`
      UPDATE penerimaan 
      SET 
        bulan = CASE MONTH(tanggal)
          WHEN 1  THEN 'Januari'   WHEN 2  THEN 'Februari'
          WHEN 3  THEN 'Maret'     WHEN 4  THEN 'April'
          WHEN 5  THEN 'Mei'       WHEN 6  THEN 'Juni'
          WHEN 7  THEN 'Juli'      WHEN 8  THEN 'Agustus'
          WHEN 9  THEN 'September' WHEN 10 THEN 'Oktober'
          WHEN 11 THEN 'November'  WHEN 12 THEN 'Desember'
        END,
        tahun = YEAR(tanggal)
      WHERE tanggal IS NOT NULL;
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`DROP TRIGGER IF EXISTS before_distribusi_update`);
    await queryInterface.sequelize.query(`DROP TRIGGER IF EXISTS before_penerimaan_update`);
  }
};

'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // ================================================================
    // DISTRIBUSI TRIGGERS
    // ================================================================

    await queryInterface.sequelize.query(`DROP TRIGGER IF EXISTS before_distribusi_insert`);
    await queryInterface.sequelize.query(`
      CREATE TRIGGER before_distribusi_insert
      BEFORE INSERT ON distribusi
      FOR EACH ROW
      BEGIN
        IF NEW.mustahiq_id IS NOT NULL THEN
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

          SET NEW.bulan = CASE MONTH(NEW.tanggal)
            WHEN 1  THEN 'Januari'   WHEN 2  THEN 'Februari'
            WHEN 3  THEN 'Maret'     WHEN 4  THEN 'April'
            WHEN 5  THEN 'Mei'       WHEN 6  THEN 'Juni'
            WHEN 7  THEN 'Juli'      WHEN 8  THEN 'Agustus'
            WHEN 9  THEN 'September' WHEN 10 THEN 'Oktober'
            WHEN 11 THEN 'November'  WHEN 12 THEN 'Desember'
          END;
          SET NEW.tahun = YEAR(NEW.tanggal);

          IF NEW.sub_program_id IS NOT NULL AND NEW.nama_program_id IS NULL THEN
            SET NEW.nama_program_id = (SELECT nama_program_id FROM ref_sub_program WHERE id = NEW.sub_program_id);
          END IF;
        END IF;
      END
    `);

    await queryInterface.sequelize.query(`DROP TRIGGER IF EXISTS after_distribusi_insert`);
    await queryInterface.sequelize.query(`
      CREATE TRIGGER after_distribusi_insert
      AFTER INSERT ON distribusi
      FOR EACH ROW
      BEGIN
        IF NEW.status = 'diterima' THEN
          UPDATE mustahiq
          SET total_penerimaan_count  = total_penerimaan_count + 1,
              total_penerimaan_amount = total_penerimaan_amount + NEW.jumlah,
              last_received_date      = NEW.tanggal
          WHERE id = NEW.mustahiq_id;
        END IF;
      END
    `);

    await queryInterface.sequelize.query(`DROP TRIGGER IF EXISTS after_distribusi_update`);
    await queryInterface.sequelize.query(`
      CREATE TRIGGER after_distribusi_update
      AFTER UPDATE ON distribusi
      FOR EACH ROW
      BEGIN
        /* 1. Handle Mustahiq ID change */
        IF NEW.mustahiq_id != OLD.mustahiq_id THEN
          /* Adjust OLD mustahiq if it was 'diterima' */
          IF OLD.status = 'diterima' THEN
            UPDATE mustahiq
            SET total_penerimaan_count  = GREATEST(total_penerimaan_count - 1, 0),
                total_penerimaan_amount = GREATEST(total_penerimaan_amount - OLD.jumlah, 0),
                last_received_date      = (SELECT MAX(tanggal) FROM distribusi WHERE mustahiq_id = OLD.mustahiq_id AND status = 'diterima')
            WHERE id = OLD.mustahiq_id;
          END IF;
          
          /* Adjust NEW mustahiq if it is 'diterima' */
          IF NEW.status = 'diterima' THEN
            UPDATE mustahiq
            SET total_penerimaan_count  = total_penerimaan_count + 1,
                total_penerimaan_amount = total_penerimaan_amount + NEW.jumlah,
                last_received_date      = NEW.tanggal
            WHERE id = NEW.mustahiq_id;
          END IF;

        /* 2. Handle Status or Amount change within SAME mustahiq */
        ELSEIF (OLD.status != NEW.status OR OLD.jumlah != NEW.jumlah) THEN
          IF OLD.status = 'diterima' AND NEW.status != 'diterima' THEN
            /* Was diterima, now not -> Subtract */
            UPDATE mustahiq
            SET total_penerimaan_count  = GREATEST(total_penerimaan_count - 1, 0),
                total_penerimaan_amount = GREATEST(total_penerimaan_amount - OLD.jumlah, 0),
                last_received_date      = (SELECT MAX(tanggal) FROM distribusi WHERE mustahiq_id = NEW.mustahiq_id AND status = 'diterima')
            WHERE id = NEW.mustahiq_id;
          
          ELSEIF OLD.status != 'diterima' AND NEW.status = 'diterima' THEN
            /* Was not diterima, now is -> Add */
            UPDATE mustahiq
            SET total_penerimaan_count  = total_penerimaan_count + 1,
                total_penerimaan_amount = total_penerimaan_amount + NEW.jumlah,
                last_received_date      = NEW.tanggal
            WHERE id = NEW.mustahiq_id;
          
          ELSEIF OLD.status = 'diterima' AND NEW.status = 'diterima' AND OLD.jumlah != NEW.jumlah THEN
            /* Both were diterima, amount changed -> Diff */
            UPDATE mustahiq
            SET total_penerimaan_amount = total_penerimaan_amount + (NEW.jumlah - OLD.jumlah),
                last_received_date      = NEW.tanggal
            WHERE id = NEW.mustahiq_id;
          END IF;
        END IF;
      END
    `);

    await queryInterface.sequelize.query(`DROP TRIGGER IF EXISTS after_distribusi_delete`);
    await queryInterface.sequelize.query(`
      CREATE TRIGGER after_distribusi_delete
      AFTER DELETE ON distribusi
      FOR EACH ROW
      BEGIN
        IF OLD.status = 'diterima' THEN
          UPDATE mustahiq
          SET total_penerimaan_count  = GREATEST(total_penerimaan_count - 1, 0),
              total_penerimaan_amount = GREATEST(total_penerimaan_amount - OLD.jumlah, 0),
              last_received_date      = (SELECT MAX(tanggal) FROM distribusi WHERE mustahiq_id = OLD.mustahiq_id AND status = 'diterima')
          WHERE id = OLD.mustahiq_id;
        END IF;
      END
    `);

    // ================================================================
    // PENERIMAAN TRIGGERS
    // ================================================================

    await queryInterface.sequelize.query(`DROP TRIGGER IF EXISTS before_penerimaan_insert`);
    await queryInterface.sequelize.query(`
      CREATE TRIGGER before_penerimaan_insert
      BEFORE INSERT ON penerimaan
      FOR EACH ROW
      BEGIN
        DECLARE v_nilai_amil DECIMAL(7,4) DEFAULT 0;

        IF NEW.muzakki_id IS NOT NULL THEN
          IF NOT EXISTS (SELECT 1 FROM muzakki WHERE id = NEW.muzakki_id) THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ERROR: muzakki_id tidak ditemukan';
          END IF;

          SET NEW.npwz             = (SELECT npwz             FROM muzakki WHERE id = NEW.muzakki_id);
          SET NEW.nama_muzakki     = (SELECT nama             FROM muzakki WHERE id = NEW.muzakki_id);
          SET NEW.nik_muzakki      = (SELECT nik              FROM muzakki WHERE id = NEW.muzakki_id);
          SET NEW.no_hp_muzakki    = (SELECT no_hp            FROM muzakki WHERE id = NEW.muzakki_id);
          SET NEW.jenis_muzakki_id = (SELECT jenis_muzakki_id FROM muzakki WHERE id = NEW.muzakki_id);
          SET NEW.jenis_upz_id     = (SELECT jenis_upz_id     FROM muzakki WHERE id = NEW.muzakki_id);

          SELECT nilai INTO v_nilai_amil FROM ref_persentase_amil WHERE id = NEW.persentase_amil_id;
          SET NEW.dana_amil   = NEW.jumlah * v_nilai_amil;
          SET NEW.dana_bersih = NEW.jumlah - NEW.dana_amil;

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
      END
    `);

    await queryInterface.sequelize.query(`DROP TRIGGER IF EXISTS after_penerimaan_insert`);
    await queryInterface.sequelize.query(`
      CREATE TRIGGER after_penerimaan_insert
      AFTER INSERT ON penerimaan
      FOR EACH ROW
      BEGIN
        UPDATE muzakki
        SET total_setor_count  = total_setor_count + 1,
            total_setor_amount = total_setor_amount + NEW.jumlah,
            last_setor_date    = NEW.tanggal
        WHERE id = NEW.muzakki_id;
      END
    `);
  },

  async down(queryInterface) {
    const triggers = [
      'before_distribusi_insert',
      'after_distribusi_insert',
      'after_distribusi_update',
      'after_distribusi_delete',
      'before_penerimaan_insert',
      'after_penerimaan_insert'
    ];
    for (const t of triggers) {
      await queryInterface.sequelize.query(`DROP TRIGGER IF EXISTS ${t}`);
    }
  }
};

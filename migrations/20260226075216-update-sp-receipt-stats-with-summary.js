'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`DROP PROCEDURE IF EXISTS sp_receipt_stats_by_month_year`);
    await queryInterface.sequelize.query(`
      CREATE PROCEDURE sp_receipt_stats_by_month_year(IN p_bulan VARCHAR(20), IN p_tahun INT)
      BEGIN
        /* 1. Total by Jenis Muzakki (Individu, Entitas, UPZ) */
        SELECT 
          jm.nama AS category,
          CAST(SUM(p.jumlah) AS DECIMAL(15,2)) AS total
        FROM penerimaan p
        JOIN ref_jenis_muzakki jm ON p.jenis_muzakki_id = jm.id
        WHERE p.tahun = p_tahun
          AND (p_bulan IS NULL OR p_bulan = '' OR p_bulan = 'all' OR p.bulan = p_bulan)
        GROUP BY jm.nama;

        /* 2. Total by Jenis Zakat (Sub-types of Zakat) */
        SELECT 
          jz.nama AS category,
          CAST(SUM(p.jumlah) AS DECIMAL(15,2)) AS total
        FROM penerimaan p
        JOIN ref_jenis_zis jz ON p.jenis_zis_id = jz.id
        JOIN ref_zis z ON jz.zis_id = z.id
        WHERE z.nama = 'Zakat'
          AND p.tahun = p_tahun
          AND (p_bulan IS NULL OR p_bulan = '' OR p_bulan = 'all' OR p.bulan = p_bulan)
        GROUP BY jz.nama;

        /* 3. Total by Jenis Infak (Sub-types of Infaq) */
        SELECT 
          jz.nama AS category,
          CAST(SUM(p.jumlah) AS DECIMAL(15,2)) AS total
        FROM penerimaan p
        JOIN ref_jenis_zis jz ON p.jenis_zis_id = jz.id
        JOIN ref_zis z ON jz.zis_id = z.id
        WHERE z.nama = 'Infaq'
          AND p.tahun = p_tahun
          AND (p_bulan IS NULL OR p_bulan = '' OR p_bulan = 'all' OR p.bulan = p_bulan)
        GROUP BY jz.nama;

        /* 4. Total by Via Penerimaan (Cash, Bank, Digital) */
        SELECT 
          v.nama AS category,
          CAST(SUM(p.jumlah) AS DECIMAL(15,2)) AS total
        FROM penerimaan p
        JOIN ref_via_penerimaan v ON p.via_id = v.id
        WHERE p.tahun = p_tahun
          AND (p_bulan IS NULL OR p_bulan = '' OR p_bulan = 'all' OR p.bulan = p_bulan)
        GROUP BY v.nama;

        /* 5. Total by Jenis UPZ */
        SELECT 
          ju.nama AS category,
          CAST(SUM(p.jumlah) AS DECIMAL(15,2)) AS total
        FROM penerimaan p
        JOIN ref_jenis_upz ju ON p.jenis_upz_id = ju.id
        WHERE p.tahun = p_tahun
          AND (p_bulan IS NULL OR p_bulan = '' OR p_bulan = 'all' OR p.bulan = p_bulan)
        GROUP BY ju.nama;

        /* 6. Summary Total for this Filtered Period */
        SELECT 
          CAST(SUM(p.jumlah) AS DECIMAL(15,2)) AS filtered_total
        FROM penerimaan p
        WHERE p.tahun = p_tahun
          AND (p_bulan IS NULL OR p_bulan = '' OR p_bulan = 'all' OR p.bulan = p_bulan);
      END
    `);
  },

  async down(queryInterface, Sequelize) {
    // We don't really want to drop it and leave it dropped, 
    // but standard practice for migrations that redefine procedures
    await queryInterface.sequelize.query(`DROP PROCEDURE IF EXISTS sp_receipt_stats_by_month_year`);
    // Ideally we would restore the previous version here, but for simplicity:
    // we just drop it or let the previous migration be re-run if we were rolling back everything.
  }
};

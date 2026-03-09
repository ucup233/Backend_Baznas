'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`DROP PROCEDURE IF EXISTS sp_distribusi_stats_by_month_year`);
    await queryInterface.sequelize.query(`
      CREATE PROCEDURE sp_distribusi_stats_by_month_year(IN p_bulan VARCHAR(20), IN p_tahun INT)
      BEGIN
        /* 1. Total by Asnaf */
        SELECT 
          a.nama AS category,
          IFNULL(CAST(SUM(d.jumlah) AS DECIMAL(15,2)), 0) AS total
        FROM ref_asnaf a
        LEFT JOIN distribusi d ON d.asnaf_id = a.id 
          AND d.status = 'diterima'
          AND d.tahun = p_tahun
          AND (p_bulan IS NULL OR p_bulan = '' OR p_bulan = 'all' OR d.bulan = p_bulan)
        WHERE a.is_active = 1
        GROUP BY a.nama;

        /* 2. Total by Nama Program */
        SELECT 
          np.nama AS category,
          CAST(SUM(d.jumlah) AS DECIMAL(15,2)) AS total
        FROM distribusi d
        JOIN ref_nama_program np ON d.nama_program_id = np.id
        WHERE d.status = 'diterima'
          AND d.tahun = p_tahun
          AND (p_bulan IS NULL OR p_bulan = '' OR p_bulan = 'all' OR d.bulan = p_bulan)
        GROUP BY np.nama;

        /* 3. Total by Kecamatan */
        SELECT 
          k.nama AS category,
          CAST(SUM(d.jumlah) AS DECIMAL(15,2)) AS total,
          COUNT(DISTINCT d.mustahiq_id) AS jumlah_mustahiq
        FROM distribusi d
        JOIN ref_kecamatan k ON d.kecamatan_id = k.id
        WHERE d.status = 'diterima'
          AND d.tahun = p_tahun
          AND (p_bulan IS NULL OR p_bulan = '' OR p_bulan = 'all' OR d.bulan = p_bulan)
        GROUP BY k.nama;

        /* 4. Summary Overview (Total ZIS, Zakat, Infaq) */
        SELECT 
          CAST(SUM(d.jumlah) AS DECIMAL(15,2)) AS total_distribusi_zis,
          CAST(SUM(CASE WHEN rjz.nama = 'Zakat' THEN d.jumlah ELSE 0 END) AS DECIMAL(15,2)) AS total_distribusi_zakat,
          CAST(SUM(CASE WHEN rjz.nama LIKE 'Infak%' THEN d.jumlah ELSE 0 END) AS DECIMAL(15,2)) AS total_distribusi_infaq
        FROM distribusi d
        LEFT JOIN ref_jenis_zis_distribusi rjz ON d.jenis_zis_distribusi_id = rjz.id
        WHERE d.status = 'diterima'
          AND d.tahun = p_tahun
          AND (p_bulan IS NULL OR p_bulan = '' OR p_bulan = 'all' OR d.bulan = p_bulan);
      END
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`DROP PROCEDURE IF EXISTS sp_distribusi_stats_by_month_year`);
  }
};

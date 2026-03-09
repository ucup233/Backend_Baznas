'use strict';

/**
 * Migration: Update both stored procedures:
 * 1. sp_receipt_stats_by_month_year — add 7th result set with dana_bersih & dana_amil sums
 * 2. sp_distribusi_stats_by_month_year — add 5th result set with by_kelurahan stats
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        // 1. Update penerimaan SP to add dana_bersih + dana_amil summary
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
        WHERE z.nama NOT LIKE 'Zakat'
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

        /* 7. Dana Bersih and Dana Amil summary */
        SELECT 
          CAST(SUM(p.dana_bersih) AS DECIMAL(15,2)) AS total_dana_bersih,
          CAST(SUM(p.dana_amil) AS DECIMAL(15,2)) AS total_dana_amil
        FROM penerimaan p
        WHERE p.tahun = p_tahun
          AND (p_bulan IS NULL OR p_bulan = '' OR p_bulan = 'all' OR p.bulan = p_bulan);
      END
    `);

        // 2. Update distribusi SP to add by_kelurahan result set
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

        /* 5. Total by Kelurahan (top 20) */
        SELECT 
          k.nama AS category,
          CAST(SUM(d.jumlah) AS DECIMAL(15,2)) AS total,
          COUNT(DISTINCT d.mustahiq_id) AS jumlah_mustahiq
        FROM distribusi d
        JOIN ref_kelurahan k ON d.kelurahan_id = k.id
        WHERE d.status = 'diterima'
          AND d.tahun = p_tahun
          AND (p_bulan IS NULL OR p_bulan = '' OR p_bulan = 'all' OR d.bulan = p_bulan)
        GROUP BY k.nama
        ORDER BY total DESC
        LIMIT 20;
      END
    `);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.sequelize.query(`DROP PROCEDURE IF EXISTS sp_receipt_stats_by_month_year`);
        await queryInterface.sequelize.query(`DROP PROCEDURE IF EXISTS sp_distribusi_stats_by_month_year`);
    }
};

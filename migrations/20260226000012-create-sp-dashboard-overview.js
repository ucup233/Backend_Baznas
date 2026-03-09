'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.sequelize.query(`DROP PROCEDURE IF EXISTS sp_dashboard_overview_by_year`);
        await queryInterface.sequelize.query(`
      CREATE PROCEDURE sp_dashboard_overview_by_year(IN p_tahun INT)
      BEGIN
        SELECT
          /* TOTAL MUZAKKI (berdasarkan registered_date) */
          (SELECT COUNT(*)
           FROM muzakki
           WHERE status = 'active'
             AND registered_date >= CONCAT(p_tahun, '-01-01')
             AND registered_date <  CONCAT(p_tahun + 1, '-01-01')
          ) AS total_muzakki,

          /* TOTAL MUSTAHIQ (berdasarkan registered_date) */
          (SELECT COUNT(*)
           FROM mustahiq
           WHERE status = 'active'
             AND registered_date >= CONCAT(p_tahun, '-01-01')
             AND registered_date <  CONCAT(p_tahun + 1, '-01-01')
          ) AS total_mustahiq,

          /* TOTAL PENERIMAAN (berdasarkan kolom tahun) */
          (SELECT COALESCE(SUM(jumlah), 0)
           FROM penerimaan
           WHERE tahun = p_tahun
          ) AS total_penerimaan,

          /* TOTAL DISTRIBUSI (berdasarkan kolom tahun) */
          (SELECT COALESCE(SUM(jumlah), 0)
           FROM distribusi
           WHERE tahun = p_tahun
             AND status = 'diterima'
          ) AS total_distribusi;
      END
    `);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.sequelize.query(`DROP PROCEDURE IF EXISTS sp_dashboard_overview_by_year`);
    }
};

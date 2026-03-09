'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // 1. Rename table ref_via_distribusi to ref_nama_entitas
        await queryInterface.renameTable('ref_via_distribusi', 'ref_nama_entitas');

        // 2. Drop existing index and foreign key on distribusi.via_id
        // Note: Foreign key name might vary, but usually it's distribusi_ibfk_X or via_id_fk
        // We should be careful about the constraint name. 
        // Let's use raw query to safely drop and recreate the column name.

        await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');

        // 3. Rename column via_id to nama_entitas_id in distribusi
        await queryInterface.renameColumn('distribusi', 'via_id', 'nama_entitas_id');

        await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');

        // 4. Seeding will be handled in the updated seeder file.
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');
        await queryInterface.renameColumn('distribusi', 'nama_entitas_id', 'via_id');
        await queryInterface.renameTable('ref_nama_entitas', 'ref_via_distribusi');
        await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
    }
};

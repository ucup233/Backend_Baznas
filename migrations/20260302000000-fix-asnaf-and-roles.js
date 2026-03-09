'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // 1. Update Distribusi Snapshot for existing NULL asnaf_id
        await queryInterface.sequelize.query(`
      UPDATE distribusi d
      JOIN mustahiq m ON d.mustahiq_id = m.id
      SET d.asnaf_id = m.asnaf_id
      WHERE d.asnaf_id IS NULL;
    `);

        // 2. Ensure triggers are robust for asnaf_id sync if not already handled
        // The previous migration 20260301000000 already has BEFORE UPDATE trigger for distribusi
        // but let's check if BEFORE INSERT is also robust.

        // 3. Update any users with 'pendistribusian' role to 'distribusi' if any exist
        await queryInterface.sequelize.query(`
      UPDATE users SET role = 'distribusi' WHERE role = 'pendistribusian';
    `);
    },

    async down(queryInterface, Sequelize) {
        // No easy way to undo asnaf_id sync without losing intentional changes
    }
};

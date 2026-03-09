'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('distribusi', 'tgl_disetujui', {
      type: Sequelize.DATEONLY,
      allowNull: true,
      after: 'status'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('distribusi', 'tgl_disetujui');
  }
};

'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('distribusi', 'tanggal', {
      type: Sequelize.DATEONLY,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    // Note: Reverting might fail if there are existing NULL values
    await queryInterface.changeColumn('distribusi', 'tanggal', {
      type: Sequelize.DATEONLY,
      allowNull: false
    });
  }
};

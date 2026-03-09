'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('penerimaan');
    if (!tableInfo.dana_amil) {
      await queryInterface.addColumn('penerimaan', 'dana_amil', {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
        after: 'jumlah'
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('penerimaan', 'dana_amil');
  }
};

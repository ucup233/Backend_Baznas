'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('mustahiq', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      nrm:  { type: Sequelize.STRING(24), allowNull: false, unique: true },
      nik:  { type: Sequelize.STRING(16), unique: true },
      nama: { type: Sequelize.STRING(100), allowNull: false },
      no_hp:  { type: Sequelize.STRING(14) },
      alamat: { type: Sequelize.TEXT },
      kelurahan_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'ref_kelurahan', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT'
      },
      kecamatan_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'ref_kecamatan', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT'
      },
      kategori_mustahiq_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'ref_kategori_mustahiq', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT'
      },
      asnaf_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'ref_asnaf', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT'
      },
      rekomendasi_upz: { type: Sequelize.TEXT },
      status: { type: Sequelize.ENUM('active', 'inactive', 'blacklist'), defaultValue: 'active' },
      total_penerimaan_count:  { type: Sequelize.INTEGER,      defaultValue: 0 },
      total_penerimaan_amount: { type: Sequelize.DECIMAL(15,2), defaultValue: 0 },
      last_received_date: { type: Sequelize.DATEONLY },
      registered_date:    { type: Sequelize.DATEONLY, allowNull: true },
      tgl_lahir:          { type: Sequelize.DATEONLY, allowNull: true },
      keterangan: { type: Sequelize.TEXT },
      registered_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT'
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
    });

    await queryInterface.addIndex('mustahiq', ['nrm'], { unique: true, name: 'nrm_unique' });
    await queryInterface.addIndex('mustahiq', ['nik'], { unique: true, name: 'nik_unique' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('mustahiq');
  }
};

'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('muzakki', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      npwz:  { type: Sequelize.STRING(15), allowNull: false, unique: true },
      nama:  { type: Sequelize.STRING(50),  allowNull: false },
      nik:   { type: Sequelize.STRING(16),  unique: true },
      no_hp: { type: Sequelize.STRING(14) },
      jenis_muzakki_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'ref_jenis_muzakki', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT'
      },
      jenis_upz_id: {
        type: Sequelize.INTEGER,
        references: { model: 'ref_jenis_upz', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL'
      },
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
      status: { type: Sequelize.ENUM('active', 'inactive'), defaultValue: 'active' },
      total_setor_count:  { type: Sequelize.INTEGER,      defaultValue: 0 },
      total_setor_amount: { type: Sequelize.DECIMAL(15,2), defaultValue: 0 },
      last_setor_date:    { type: Sequelize.DATEONLY },
      registered_date:    { type: Sequelize.DATEONLY, allowNull: true },
      tgl_lahir:          { type: Sequelize.DATEONLY, allowNull: true },
      keterangan:   { type: Sequelize.TEXT },
      registered_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT'
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
    });

    await queryInterface.addIndex('muzakki', ['npwz'], { unique: true, name: 'npwz_unique' });
    await queryInterface.addIndex('muzakki', ['nik'],  { unique: true, name: 'nik_unique' });
    await queryInterface.addIndex('muzakki', ['nama'], { name: 'nama_index' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('muzakki');
  }
};

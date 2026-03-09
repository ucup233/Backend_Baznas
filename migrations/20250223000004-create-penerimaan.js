'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('penerimaan', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      muzakki_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'muzakki', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT'
      },
      // Snapshot / denormalized
      npwz:          { type: Sequelize.STRING(20) },
      nama_muzakki:  { type: Sequelize.STRING(150), allowNull: false },
      nik_muzakki:   { type: Sequelize.STRING(20) },
      no_hp_muzakki: { type: Sequelize.STRING(14) },
      jenis_muzakki_id: { type: Sequelize.INTEGER },
      jenis_upz_id:     { type: Sequelize.INTEGER },

      tanggal: { type: Sequelize.DATEONLY, allowNull: false },
      bulan:   { type: Sequelize.STRING(20) },
      tahun:   { type: Sequelize.INTEGER },

      via_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'ref_via_penerimaan', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT'
      },
      metode_bayar_id: {
        type: Sequelize.INTEGER,
        references: { model: 'ref_metode_bayar', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL'
      },
      no_rekening: { type: Sequelize.STRING(50) },

      zis_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'ref_zis', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT'
      },
      jenis_zis_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'ref_jenis_zis', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT'
      },

      jumlah: { type: Sequelize.DECIMAL(15,2), allowNull: false },
      persentase_amil_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'ref_persentase_amil', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT'
      },
      dana_amil:   { type: Sequelize.DECIMAL(15,2) },
      dana_bersih: { type: Sequelize.DECIMAL(15,2) },

      keterangan:      { type: Sequelize.TEXT },
      rekomendasi_upz: { type: Sequelize.TEXT },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT'
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
    });

    await queryInterface.addIndex('penerimaan', ['muzakki_id']);
    await queryInterface.addIndex('penerimaan', ['npwz']);
    await queryInterface.addIndex('penerimaan', ['tanggal']);
    await queryInterface.addIndex('penerimaan', ['jenis_zis_id']);
    await queryInterface.addIndex('penerimaan', ['via_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('penerimaan');
  }
};

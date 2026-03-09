'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('distribusi', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      mustahiq_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'mustahiq', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT'
      },
      // Snapshot / denormalized
      nrm:           { type: Sequelize.STRING(24) },
      nama_mustahik: { type: Sequelize.STRING(200), allowNull: false },
      nik:           { type: Sequelize.STRING(20) },
      alamat:        { type: Sequelize.TEXT },
      kelurahan_id:  { type: Sequelize.INTEGER },
      kecamatan_id:  { type: Sequelize.INTEGER },
      asnaf_id:      { type: Sequelize.INTEGER },
      no_hp:         { type: Sequelize.STRING(20) },

      tanggal: { type: Sequelize.DATEONLY, allowNull: false },
      bulan:   { type: Sequelize.STRING(20) },
      tahun:   { type: Sequelize.INTEGER },

      nama_program_id: {
        type: Sequelize.INTEGER,
        references: { model: 'ref_nama_program', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL'
      },
      sub_program_id: {
        type: Sequelize.INTEGER,
        references: { model: 'ref_sub_program', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL'
      },
      program_kegiatan_id: {
        type: Sequelize.INTEGER,
        references: { model: 'ref_program_kegiatan', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL'
      },
      frekuensi_bantuan_id: {
        type: Sequelize.INTEGER,
        references: { model: 'ref_frekuensi_bantuan', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL'
      },

      jumlah:   { type: Sequelize.DECIMAL(15,2), allowNull: false },
      quantity: { type: Sequelize.INTEGER },

      via_id: {
        type: Sequelize.INTEGER,
        references: { model: 'ref_via_distribusi', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL'
      },
      kategori_mustahiq_id: {
        type: Sequelize.INTEGER,
        references: { model: 'ref_kategori_mustahiq', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL'
      },
      infak_id: {
        type: Sequelize.INTEGER,
        references: { model: 'ref_infak', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL'
      },
      jenis_zis_distribusi_id: {
        type: Sequelize.INTEGER,
        references: { model: 'ref_jenis_zis_distribusi', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL'
      },

      keterangan:      { type: Sequelize.TEXT },
      tgl_masuk_permohonan: { type: Sequelize.DATEONLY, allowNull: true },
      tgl_survei:           { type: Sequelize.DATEONLY, allowNull: true },
      surveyor:             { type: Sequelize.STRING(100), allowNull: true },
      jumlah_permohonan:    { type: Sequelize.DECIMAL(15, 2), allowNull: true },
      status:               { type: Sequelize.ENUM('menunggu', 'diterima', 'ditolak'), allowNull: true, defaultValue: 'menunggu' },
      no_reg_bpp:           { type: Sequelize.STRING(12), allowNull: true },
      rekomendasi_upz: { type: Sequelize.TEXT },
      no_rekening:     { type: Sequelize.STRING(50) },
      created_by: {
        type: Sequelize.INTEGER,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL'
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
    });

    await queryInterface.addIndex('distribusi', ['mustahiq_id']);
    await queryInterface.addIndex('distribusi', ['nrm']);
    await queryInterface.addIndex('distribusi', ['nik']);
    await queryInterface.addIndex('distribusi', ['tanggal']);
    await queryInterface.addIndex('distribusi', ['nama_program_id']);
    await queryInterface.addIndex('distribusi', ['sub_program_id']);
    await queryInterface.addIndex('distribusi', ['program_kegiatan_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('distribusi');
  }
};

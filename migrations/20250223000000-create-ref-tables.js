'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. ref_kecamatan
    await queryInterface.createTable('ref_kecamatan', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nama: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      is_active: { type: Sequelize.TINYINT, defaultValue: 1 },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
    });

    // 2. ref_kelurahan
    await queryInterface.createTable('ref_kelurahan', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nama: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      kecamatan_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'ref_kecamatan', key: 'id' }
      },
      is_active: { type: Sequelize.TINYINT, defaultValue: 1 },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
    });

    // 3. ref_asnaf
    await queryInterface.createTable('ref_asnaf', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nama: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      deskripsi: { type: Sequelize.TEXT },
      is_active: { type: Sequelize.TINYINT, defaultValue: 1 },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
    });

    // 4. ref_kategori_mustahiq
    await queryInterface.createTable('ref_kategori_mustahiq', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nama: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      is_active: { type: Sequelize.TINYINT, defaultValue: 1 },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
    });

    // 5. ref_nama_program
    await queryInterface.createTable('ref_nama_program', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nama: { type: Sequelize.STRING(100), allowNull: false, unique: true },
      deskripsi: { type: Sequelize.TEXT },
      is_active: { type: Sequelize.TINYINT, defaultValue: 1 },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
    });

    // 6. ref_sub_program
    await queryInterface.createTable('ref_sub_program', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nama_program_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'ref_nama_program', key: 'id' }
      },
      nama: { type: Sequelize.STRING(200), allowNull: false },
      is_active: { type: Sequelize.TINYINT, defaultValue: 1 },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
    });
    await queryInterface.addIndex('ref_sub_program', ['nama_program_id', 'nama'], {
      unique: true, name: 'unique_sub_program'
    });

    // 7. ref_program_kegiatan
    await queryInterface.createTable('ref_program_kegiatan', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      sub_program_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'ref_sub_program', key: 'id' }
      },
      nama: { type: Sequelize.STRING(200), allowNull: false },
      is_active: { type: Sequelize.TINYINT, defaultValue: 1 },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
    });
    await queryInterface.addIndex('ref_program_kegiatan', ['sub_program_id', 'nama'], {
      unique: true, name: 'unique_program_kegiatan'
    });

    // 8. ref_via_distribusi
    await queryInterface.createTable('ref_via_distribusi', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nama: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      is_active: { type: Sequelize.TINYINT, defaultValue: 1 },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
    });

    // 9. ref_via_penerimaan
    await queryInterface.createTable('ref_via_penerimaan', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nama: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      is_active: { type: Sequelize.TINYINT, defaultValue: 1 },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
    });

    // 10. ref_metode_bayar
    await queryInterface.createTable('ref_metode_bayar', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nama: { type: Sequelize.STRING(50), allowNull: false },
      via_penerimaan_id: {
        type: Sequelize.INTEGER,
        references: { model: 'ref_via_penerimaan', key: 'id' }
      },
      is_active: { type: Sequelize.TINYINT, defaultValue: 1 },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
    });
    await queryInterface.addIndex('ref_metode_bayar', ['via_penerimaan_id', 'nama'], {
      unique: true, name: 'unique_metode_bayar_via'
    });

    // 11. ref_zis
    await queryInterface.createTable('ref_zis', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nama: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      is_active: { type: Sequelize.TINYINT, defaultValue: 1 },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
    });

    // 12. ref_jenis_zis
    await queryInterface.createTable('ref_jenis_zis', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      zis_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'ref_zis', key: 'id' }
      },
      nama: { type: Sequelize.STRING(100), allowNull: false, unique: true },
      is_active: { type: Sequelize.TINYINT, defaultValue: 1 },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
    });

    // 13. ref_jenis_zis_distribusi
    await queryInterface.createTable('ref_jenis_zis_distribusi', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nama: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      is_active: { type: Sequelize.TINYINT, defaultValue: 1 },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
    });

    // 14. ref_persentase_amil
    await queryInterface.createTable('ref_persentase_amil', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      label: { type: Sequelize.STRING(10), allowNull: false, unique: true },
      nilai: { type: Sequelize.DECIMAL(5, 4), allowNull: false },
      is_active: { type: Sequelize.TINYINT, defaultValue: 1 },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
    });

    // 15. ref_jenis_muzakki
    await queryInterface.createTable('ref_jenis_muzakki', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nama: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      is_active: { type: Sequelize.TINYINT, defaultValue: 1 },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
    });

    // 16. ref_jenis_upz
    await queryInterface.createTable('ref_jenis_upz', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nama: { type: Sequelize.STRING(100), allowNull: false, unique: true },
      is_active: { type: Sequelize.TINYINT, defaultValue: 1 },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
    });

    // 17. ref_frekuensi_bantuan
    await queryInterface.createTable('ref_frekuensi_bantuan', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nama: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      is_active: { type: Sequelize.TINYINT, defaultValue: 1 },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
    });

    // 18. ref_infak
    await queryInterface.createTable('ref_infak', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nama: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      is_active: { type: Sequelize.TINYINT, defaultValue: 1 },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
    });
  },

  async down(queryInterface) {
    // Drop dalam urutan terbalik (child table dulu, baru parent)
    await queryInterface.dropTable('ref_infak');
    await queryInterface.dropTable('ref_frekuensi_bantuan');
    await queryInterface.dropTable('ref_jenis_upz');
    await queryInterface.dropTable('ref_jenis_muzakki');
    await queryInterface.dropTable('ref_persentase_amil');
    await queryInterface.dropTable('ref_jenis_zis_distribusi');
    await queryInterface.dropTable('ref_jenis_zis');
    await queryInterface.dropTable('ref_zis');
    await queryInterface.dropTable('ref_metode_bayar');
    await queryInterface.dropTable('ref_via_penerimaan');
    await queryInterface.dropTable('ref_via_distribusi');
    await queryInterface.dropTable('ref_program_kegiatan');
    await queryInterface.dropTable('ref_sub_program');
    await queryInterface.dropTable('ref_nama_program');
    await queryInterface.dropTable('ref_kategori_mustahiq');
    await queryInterface.dropTable('ref_asnaf');
    await queryInterface.dropTable('ref_kelurahan');
    await queryInterface.dropTable('ref_kecamatan');
  }
};

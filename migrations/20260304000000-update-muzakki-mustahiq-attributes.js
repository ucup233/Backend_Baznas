'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Add npwp and jenis_kelamin to muzakki
    await queryInterface.addColumn('muzakki', 'npwp', {
      type: Sequelize.STRING(20),
      allowNull: true,
    });
    await queryInterface.addColumn('muzakki', 'jenis_kelamin', {
      type: Sequelize.ENUM('Laki-laki', 'Perempuan'),
      allowNull: true,
    });

    // 2. Add jenis_kelamin to mustahiq
    await queryInterface.addColumn('mustahiq', 'jenis_kelamin', {
      type: Sequelize.ENUM('Laki-laki', 'Perempuan'),
      allowNull: true,
    });

    // 3. Handle NULL values for nik and no_hp before setting NOT NULL
    // We'll use '0000000000000000' for NIK and '000000000000' for No HP as placeholders if necessary
    
    await queryInterface.sequelize.query(`
      UPDATE muzakki SET nik = '0000000000000000' WHERE nik IS NULL;
    `);
    await queryInterface.sequelize.query(`
      UPDATE muzakki SET no_hp = '000000000000' WHERE no_hp IS NULL;
    `);
    await queryInterface.sequelize.query(`
      UPDATE mustahiq SET nik = '0000000000000000' WHERE nik IS NULL;
    `);
    await queryInterface.sequelize.query(`
      UPDATE mustahiq SET no_hp = '000000000000' WHERE no_hp IS NULL;
    `);

    // 4. Change nik and no_hp to NOT NULL in muzakki
    await queryInterface.changeColumn('muzakki', 'nik', {
      type: Sequelize.STRING(16),
      allowNull: false
    });
    // Note: unique constraint is already there from initial migration, 
    // but if we need to ensure it:
    // { type: Sequelize.STRING(16), allowNull: false, unique: true }

    await queryInterface.changeColumn('muzakki', 'no_hp', {
      type: Sequelize.STRING(14),
      allowNull: false
    });

    // 5. Change nik and no_hp to NOT NULL in mustahiq
    await queryInterface.changeColumn('mustahiq', 'nik', {
      type: Sequelize.STRING(16),
      allowNull: false
    });
    await queryInterface.changeColumn('mustahiq', 'no_hp', {
      type: Sequelize.STRING(14),
      allowNull: false
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert changes
    await queryInterface.changeColumn('muzakki', 'nik', {
      type: Sequelize.STRING(16),
      allowNull: true
    });
    await queryInterface.changeColumn('muzakki', 'no_hp', {
      type: Sequelize.STRING(14),
      allowNull: true
    });
    await queryInterface.changeColumn('mustahiq', 'nik', {
      type: Sequelize.STRING(16),
      allowNull: true
    });
    await queryInterface.changeColumn('mustahiq', 'no_hp', {
      type: Sequelize.STRING(14),
      allowNull: true
    });

    await queryInterface.removeColumn('muzakki', 'npwp');
    await queryInterface.removeColumn('muzakki', 'jenis_kelamin');
    await queryInterface.removeColumn('mustahiq', 'jenis_kelamin');
  }
};

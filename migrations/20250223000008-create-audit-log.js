module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('audit_log', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      tabel: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      aksi: {
        type: Sequelize.ENUM('INSERT', 'UPDATE', 'DELETE'),
        allowNull: false
      },
      data_lama: {
        type: Sequelize.JSON,
        allowNull: true
      },
      data_baru: {
        type: Sequelize.JSON,
        allowNull: true
      },
      ip_address: {
        type: Sequelize.STRING(45),
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('audit_log');
  }
};

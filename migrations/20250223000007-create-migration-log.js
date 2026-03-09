module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('migration_log', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      jenis: {
        type: Sequelize.ENUM('mustahiq', 'muzakki', 'penerimaan', 'distribusi'),
        allowNull: false
      },
      filename: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      total_rows: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      success_rows: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      failed_rows: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('migration_log');
  }
};

'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Columns moved to initial create-table migrations
    },

    async down(queryInterface) {
        // Handled by dropping tables in initial migrations
    }
};

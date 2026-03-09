'use strict';

const bcrypt = require('bcrypt');

/**
 * Seeder Superadmin — akun default untuk akses pertama kali.
 * Password akan di-hash menggunakan bcrypt sebelum disimpan.
 * 
 * PENTING: Ganti password default ini setelah login pertama!
 * 
 * @type {import('sequelize-cli').Seeder}
 */

const SUPERADMIN_USERNAME = process.env.SEED_ADMIN_USERNAME || 'baznasbatam01';
const SUPERADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'baznas01';
const SUPERADMIN_NAMA     = 'Super Admin Baznas';

module.exports = {
  async up(queryInterface) {
    const hashedPassword = await bcrypt.hash(SUPERADMIN_PASSWORD, 12);

    await queryInterface.bulkInsert('users', [{
      username:   SUPERADMIN_USERNAME,
      password:   hashedPassword,
      nama:       SUPERADMIN_NAMA,
      role:       'superadmin',
      createdAt: new Date(),
      updatedAt: new Date()
    }], { ignoreDuplicates: true });
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', {
      username: SUPERADMIN_USERNAME
    }, {});
  }
};

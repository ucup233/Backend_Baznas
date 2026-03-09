'use strict';

/**
 * Seeder ref_kecamatan — 12 kecamatan Kota Batam.
 * Sumber: BPS Kota Batam & Kemendagri (data valid 2024–2025).
 * Catatan: nama kecamatan "Sei Beduk" digunakan sesuai nomenklatur resmi pemerintah
 * (bukan "Sagulung" atau "Sungai Beduk").
 *
 * @type {import('sequelize-cli').Seeder}
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('ref_kecamatan', [
      { nama: 'Batam Kota' },
      { nama: 'Nongsa' },
      { nama: 'Bengkong' },
      { nama: 'Batu Ampar' },
      { nama: 'Sekupang' },
      { nama: 'Belakang Padang' },
      { nama: 'Bulang' },
      { nama: 'Sagulung' },
      { nama: 'Galang' },
      { nama: 'Lubuk Baja' },
      { nama: 'Sei Beduk' },
      { nama: 'Batu Aji' },
    ], { ignoreDuplicates: true });
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('ref_kecamatan', null, {});
  }
};
'use strict';

/**
 * Migration ini sudah obsolete — kolom registered_date sudah tidak pernah
 * ditambahkan di migration create-muzakki dan create-mustahiq yang baru.
 * File ini dibiarkan sebagai no-op agar riwayat migration tetap konsisten.
 */
module.exports = {
  async up(queryInterface) {
    // no-op: registered_date sudah tidak ada di schema baru
  },
  async down(queryInterface) {
    // no-op
  }
};

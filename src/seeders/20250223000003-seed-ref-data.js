'use strict';

/**
 * Seeder untuk data awal non-lokasi:
 * ref_asnaf, ref_kategori_mustahiq, ref_nama_program, ref_sub_program,
 * ref_nama_entitas, ref_via_penerimaan, ref_metode_bayar,
 * ref_zis, ref_jenis_zis, ref_jenis_zis_distribusi,
 * ref_persentase_amil, ref_jenis_muzakki, ref_jenis_upz,
 * ref_frekuensi_bantuan, ref_infak
 * 
 * @type {import('sequelize-cli').Seeder}
 */
module.exports = {
  async up(queryInterface) {
    // 1. ref_asnaf
    await queryInterface.bulkInsert('ref_asnaf', [
      { nama: 'Fakir', deskripsi: null },
      { nama: 'Miskin', deskripsi: null },
      { nama: 'Amil', deskripsi: null },
      { nama: 'Muallaf', deskripsi: null },
      { nama: 'Riqob', deskripsi: null },
      { nama: 'Gharimin', deskripsi: null },
      { nama: 'Fisabillillah', deskripsi: null },
      { nama: 'Ibnu Sabil', deskripsi: null }
    ], { ignoreDuplicates: true });

    // 2. ref_kategori_mustahiq
    await queryInterface.bulkInsert('ref_kategori_mustahiq', [
      { nama: 'Individu' },
      { nama: 'Lembaga' },
      { nama: 'Masjid' }
    ], { ignoreDuplicates: true });

    // 3. ref_nama_program
    await queryInterface.bulkInsert('ref_nama_program', [
      { nama: 'Batam Cerdas', deskripsi: null },
      { nama: 'Batam Sehat', deskripsi: null },
      { nama: 'Batam Makmur', deskripsi: null },
      { nama: 'Batam Peduli', deskripsi: null },
      { nama: 'Batam Taqwa', deskripsi: null }
    ], { ignoreDuplicates: true });

    // 4. ref_nama_entitas
    await queryInterface.bulkInsert('ref_nama_entitas', [
      { nama: 'Cash' },
      { nama: 'Mandiri' },
      { nama: 'BRI' },
      { nama: 'BSI' }
    ], { ignoreDuplicates: true });

    // 5. ref_via_penerimaan
    await queryInterface.bulkInsert('ref_via_penerimaan', [
      { nama: 'Cash' },
      { nama: 'Bank' },
      { nama: 'Kantor Digital' }
    ], { ignoreDuplicates: true });

    // 6. ref_zis
    await queryInterface.bulkInsert('ref_zis', [
      { nama: 'Zakat' },
      { nama: 'Infaq' }
    ], { ignoreDuplicates: true });

    // 7. ref_jenis_zis_distribusi
    await queryInterface.bulkInsert('ref_jenis_zis_distribusi', [
      { nama: 'Zakat' },
      { nama: 'Infak' }
    ], { ignoreDuplicates: true });

    // 8. ref_persentase_amil
    await queryInterface.bulkInsert('ref_persentase_amil', [
      { label: '12.5%', nilai: 0.125 },
      { label: '20%', nilai: 0.20 }
    ], { ignoreDuplicates: true });

    // 9. ref_jenis_muzakki
    await queryInterface.bulkInsert('ref_jenis_muzakki', [
      { nama: 'Individu' },
      { nama: 'Entitas' },
      { nama: 'UPZ' }
    ], { ignoreDuplicates: true });

    // 10. ref_frekuensi_bantuan
    await queryInterface.bulkInsert('ref_frekuensi_bantuan', [
      { nama: 'Rutin' },
      { nama: 'Tidak Rutin' }
    ], { ignoreDuplicates: true });

    // 11. ref_infak
    await queryInterface.bulkInsert('ref_infak', [
      { nama: 'Infak Terikat' },
      { nama: 'Infak Tidak Terikat' }
    ], { ignoreDuplicates: true });
  },

  async down(queryInterface) {
    // Hapus dalam urutan terbalik (child dulu)
    await queryInterface.bulkDelete('ref_infak', null, {});
    await queryInterface.bulkDelete('ref_frekuensi_bantuan', null, {});
    await queryInterface.bulkDelete('ref_jenis_muzakki', null, {});
    await queryInterface.bulkDelete('ref_persentase_amil', null, {});
    await queryInterface.bulkDelete('ref_jenis_zis_distribusi', null, {});
    await queryInterface.bulkDelete('ref_zis', null, {});
    await queryInterface.bulkDelete('ref_via_penerimaan', null, {});
    await queryInterface.bulkDelete('ref_nama_entitas', null, {});
    await queryInterface.bulkDelete('ref_nama_program', null, {});
    await queryInterface.bulkDelete('ref_kategori_mustahiq', null, {});
    await queryInterface.bulkDelete('ref_asnaf', null, {});
  }
};

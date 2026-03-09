'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // 1. Cleanup old data
        // We delete ref_program_kegiatan first because it has a FK to ref_sub_program
        await queryInterface.bulkDelete('ref_program_kegiatan', null, {});
        await queryInterface.bulkDelete('ref_sub_program', null, {});

        // 2. Map Program Names to IDs
        const [programRows] = await queryInterface.sequelize.query(
            `SELECT id, nama FROM ref_nama_program`
        );
        const progMap = {};
        programRows.forEach(r => { progMap[r.nama] = r.id; });

        // 3. Seed ref_sub_program
        const subPrograms = [
            /* ================= BATAM PEDULI ================= */
            { nama_program_id: progMap['Batam Peduli'], nama: 'Bantuan Makanan Asnaf Fakir' },
            { nama_program_id: progMap['Batam Peduli'], nama: 'Bantuan Makanan Asnaf Miskin' },
            { nama_program_id: progMap['Batam Peduli'], nama: 'Bantuan Makanan Asnaf Ibnu Sabil' },
            { nama_program_id: progMap['Batam Peduli'], nama: 'Bantuan Makanan | Fidyah' },
            { nama_program_id: progMap['Batam Peduli'], nama: 'Bantuan Makanan | DSKL' },
            { nama_program_id: progMap['Batam Peduli'], nama: 'Bantuan Makanan | Infak/Sedekah Tidak Terikat' },
            { nama_program_id: progMap['Batam Peduli'], nama: 'Bantuan Biaya Hidup Asnaf Fakir' },
            { nama_program_id: progMap['Batam Peduli'], nama: 'Bantuan Biaya Hidup Asnaf Miskin' },
            { nama_program_id: progMap['Batam Peduli'], nama: 'Bantuan Biaya Hidup Asnaf Riqab' },
            { nama_program_id: progMap['Batam Peduli'], nama: 'Bantuan Biaya Hidup Asnaf Ibnu Sabil' },
            { nama_program_id: progMap['Batam Peduli'], nama: 'Bantuan Biaya Hidup | Fidyah' },
            { nama_program_id: progMap['Batam Peduli'], nama: 'Bantuan Biaya Hidup | DSKL' },
            { nama_program_id: progMap['Batam Peduli'], nama: 'Bantuan Biaya Hidup | Infak/Sedekah Tidak Terikat' },
            { nama_program_id: progMap['Batam Peduli'], nama: 'Bantuan Penyaluran Fitrah Asnaf Fakir' },
            { nama_program_id: progMap['Batam Peduli'], nama: 'Bantuan Penyaluran Fitrah Asnaf Miskin' },
            { nama_program_id: progMap['Batam Peduli'], nama: 'Bantuan Penyaluran Kurban' },
            { nama_program_id: progMap['Batam Peduli'], nama: 'Bantuan Rumah Singgah Asnaf Fakir' },
            { nama_program_id: progMap['Batam Peduli'], nama: 'Bantuan Rumah Singgah Asnaf Miskin' },
            { nama_program_id: progMap['Batam Peduli'], nama: 'Bantuan Rumah Singgah Asnaf Ibnu Sabil' },
            { nama_program_id: progMap['Batam Peduli'], nama: 'Bantuan Rumah Singgah | DSKL' },
            { nama_program_id: progMap['Batam Peduli'], nama: 'Bantuan Rumah Singgah | Infak/Sedekah Tidak Terikat' },
            { nama_program_id: progMap['Batam Peduli'], nama: 'Rumah Tinggal Layak Huni Asnaf Fakir' },
            { nama_program_id: progMap['Batam Peduli'], nama: 'Rumah Tinggal Layak Huni Asnaf Miskin' },
            { nama_program_id: progMap['Batam Peduli'], nama: 'Rumah Tinggal Layak Huni | DSKL' },
            { nama_program_id: progMap['Batam Peduli'], nama: 'Rumah Tinggal Layak Huni | Infak/Sedekah Tidak Terikat' },
            { nama_program_id: progMap['Batam Peduli'], nama: 'Pengurangan Risiko Bencana Asnaf Fakir' },
            { nama_program_id: progMap['Batam Peduli'], nama: 'Pengurangan Risiko Bencana Asnaf Miskin' },
            { nama_program_id: progMap['Batam Peduli'], nama: 'Pengurangan Risiko Bencana | DSKL' },
            { nama_program_id: progMap['Batam Peduli'], nama: 'Pengurangan Risiko Bencana | Infak/Sedekah Tidak Terikat' },
            { nama_program_id: progMap['Batam Peduli'], nama: 'Respon Darurat Bencana Asnaf Fakir' },
            { nama_program_id: progMap['Batam Peduli'], nama: 'Respon Darurat Bencana | DSKL' },
            { nama_program_id: progMap['Batam Peduli'], nama: 'Respon Darurat Bencana | Infak/Sedekah Tidak Terikat' },
            { nama_program_id: progMap['Batam Peduli'], nama: 'Pemulihan Pascabencana Asnaf Fakir' },
            { nama_program_id: progMap['Batam Peduli'], nama: 'Pemulihan Pascabencana Asnaf Miskin' },
            { nama_program_id: progMap['Batam Peduli'], nama: 'Pemulihan Pascabencana | DSKL' },
            { nama_program_id: progMap['Batam Peduli'], nama: 'Pemulihan Pascabencana | Infak/Sedekah Tidak Terikat' },
            { nama_program_id: progMap['Batam Peduli'], nama: 'Pemulasaran Jenazah Asnaf Fakir' },
            { nama_program_id: progMap['Batam Peduli'], nama: 'Pemulasaran Jenazah Asnaf Miskin' },
            { nama_program_id: progMap['Batam Peduli'], nama: 'Pemulasaran Jenazah | DSKL' },
            { nama_program_id: progMap['Batam Peduli'], nama: 'Pemulasaran Jenazah | Infak/Sedekah Tidak Terikat' },
            { nama_program_id: progMap['Batam Peduli'], nama: 'Bantuan Pelunasan Utang Asnaf Gharimin' },
            { nama_program_id: progMap['Batam Peduli'], nama: 'Bantuan Pelunasan Utang | DSKL' },
            { nama_program_id: progMap['Batam Peduli'], nama: 'Bantuan Pelunasan Utang | Infak/Sedekah Tidak Terikat' },
            { nama_program_id: progMap['Batam Peduli'], nama: 'Penyaluran Tidak Langsung Asnaf Fakir (Kemanusiaan)' },
            { nama_program_id: progMap['Batam Peduli'], nama: 'Penyaluran Tidak Langsung Asnaf Miskin (Kemanusiaan)' },
            { nama_program_id: progMap['Batam Peduli'], nama: 'Penyaluran Tidak Langsung Asnaf Riqab (Kemanusiaan)' },
            { nama_program_id: progMap['Batam Peduli'], nama: 'Penyaluran Tidak Langsung Asnaf Ibnu Sabil (Kemanusiaan)' },

            /* ================= BATAM SEHAT ================= */
            { nama_program_id: progMap['Batam Sehat'], nama: 'Bantuan Alat Kesehatan Asnaf Fakir' },
            { nama_program_id: progMap['Batam Sehat'], nama: 'Bantuan Alat Kesehatan Asnaf Miskin' },
            { nama_program_id: progMap['Batam Sehat'], nama: 'Bantuan Alat Kesehatan | DSKL' },
            { nama_program_id: progMap['Batam Sehat'], nama: 'Bantuan Alat Kesehatan | Infak/Sedekah Tidak Terikat' },
            { nama_program_id: progMap['Batam Sehat'], nama: 'Khitanan Masal Asnaf Fakir' },
            { nama_program_id: progMap['Batam Sehat'], nama: 'Khitanan Masal Asnaf Miskin' },
            { nama_program_id: progMap['Batam Sehat'], nama: 'Khitanan Masal | DSKL' },
            { nama_program_id: progMap['Batam Sehat'], nama: 'Khitanan Masal | Infak/Sedekah Tidak Terikat' },
            { nama_program_id: progMap['Batam Sehat'], nama: 'Bantuan Pengobatan Asnaf Fakir' },
            { nama_program_id: progMap['Batam Sehat'], nama: 'Bantuan Pengobatan Asnaf Miskin' },
            { nama_program_id: progMap['Batam Sehat'], nama: 'Bantuan Pengobatan | DSKL' },
            { nama_program_id: progMap['Batam Sehat'], nama: 'Bantuan Pengobatan | Infak/Sedekah Tidak Terikat' },
            { nama_program_id: progMap['Batam Sehat'], nama: 'Bantuan Asuransi Kesehatan Asnaf Fakir' },
            { nama_program_id: progMap['Batam Sehat'], nama: 'Bantuan Asuransi Kesehatan Asnaf Miskin' },
            { nama_program_id: progMap['Batam Sehat'], nama: 'Bantuan Asuransi Kesehatan | DSKL' },
            { nama_program_id: progMap['Batam Sehat'], nama: 'Bantuan Asuransi Kesehatan | Infak/Sedekah Tidak Terikat' },
            { nama_program_id: progMap['Batam Sehat'], nama: 'Bantuan Transportasi dan/atau Akomodasi Pasien Asnaf Fakir' },
            { nama_program_id: progMap['Batam Sehat'], nama: 'Bantuan Transportasi dan/atau Akomodasi Pasien Asnaf Miskin' },
            { nama_program_id: progMap['Batam Sehat'], nama: 'Bantuan Transportasi dan/atau Akomodasi Pasien | DSKL' },
            { nama_program_id: progMap['Batam Sehat'], nama: 'Bantuan Transportasi dan/atau Akomodasi Pasien | Infak/Sedekah Tidak Terikat' },
            { nama_program_id: progMap['Batam Sehat'], nama: 'Bantuan Sanitasi Asnaf Fakir' },
            { nama_program_id: progMap['Batam Sehat'], nama: 'Bantuan Sanitasi Asnaf Miskin' },
            { nama_program_id: progMap['Batam Sehat'], nama: 'Bantuan Sanitasi | DSKL' },
            { nama_program_id: progMap['Batam Sehat'], nama: 'Bantuan Sanitasi | Infak/Sedekah Tidak Terikat' },
            { nama_program_id: progMap['Batam Sehat'], nama: 'Bantuan Sumur Air Asnaf Fakir' },
            { nama_program_id: progMap['Batam Sehat'], nama: 'Bantuan Sumur Air Asnaf Miskin' },
            { nama_program_id: progMap['Batam Sehat'], nama: 'Bantuan Sumur Air | DSKL' },
            { nama_program_id: progMap['Batam Sehat'], nama: 'Bantuan Sumur Air | Infak/Sedekah Tidak Terikat' },
            { nama_program_id: progMap['Batam Sehat'], nama: 'Bantuan Operasional Fasilitas Kesehatan Asnaf Fakir' },
            { nama_program_id: progMap['Batam Sehat'], nama: 'Bantuan Operasional Fasilitas Kesehatan Asnaf Miskin' },
            { nama_program_id: progMap['Batam Sehat'], nama: 'Bantuan Operasional Fasilitas Kesehatan | DSKL' },
            { nama_program_id: progMap['Batam Sehat'], nama: 'Bantuan Operasional Fasilitas Kesehatan | Infak/Sedekah Tidak Terikat' },
            { nama_program_id: progMap['Batam Sehat'], nama: 'Bantuan Infrastruktur Fasilitas Kesehatan Asnaf Fakir' },
            { nama_program_id: progMap['Batam Sehat'], nama: 'Bantuan Infrastruktur Fasilitas Kesehatan Asnaf Miskin' },
            { nama_program_id: progMap['Batam Sehat'], nama: 'Bantuan Infrastruktur Fasilitas Kesehatan | DSKL' },
            { nama_program_id: progMap['Batam Sehat'], nama: 'Bantuan Infrastruktur Fasilitas Kesehatan | Infak/Sedekah Tidak Terikat' },
            { nama_program_id: progMap['Batam Sehat'], nama: 'Bantuan Edukasi/Promosi Kesehatan Asnaf Fakir' },
            { nama_program_id: progMap['Batam Sehat'], nama: 'Bantuan Edukasi/Promosi Kesehatan Asnaf Miskin' },
            { nama_program_id: progMap['Batam Sehat'], nama: 'Bantuan Edukasi/Promosi Kesehatan | DSKL' },
            { nama_program_id: progMap['Batam Sehat'], nama: 'Bantuan Edukasi/Promosi Kesehatan | Infak/Sedekah Tidak Terikat' },
            { nama_program_id: progMap['Batam Sehat'], nama: 'Bantuan Penyediaan Air Bersih Asnaf Fakir' },
            { nama_program_id: progMap['Batam Sehat'], nama: 'Bantuan Penyediaan Air Bersih Asnaf Miskin' },
            { nama_program_id: progMap['Batam Sehat'], nama: 'Bantuan Penyediaan Air Bersih | DSKL' },
            { nama_program_id: progMap['Batam Sehat'], nama: 'Bantuan Penyediaan Air Bersih | Infak/Sedekah Tidak Terikat' },
            { nama_program_id: progMap['Batam Sehat'], nama: 'Pencegahan dan Penanggulangan Stunting Asnaf Fakir' },
            { nama_program_id: progMap['Batam Sehat'], nama: 'Pencegahan dan Penanggulangan Stunting Asnaf Miskin' },
            { nama_program_id: progMap['Batam Sehat'], nama: 'Pencegahan dan Penanggulangan Stunting | DSKL' },
            { nama_program_id: progMap['Batam Sehat'], nama: 'Pencegahan dan Penanggulangan Stunting | Infak/Sedekah Tidak Terikat' },
            { nama_program_id: progMap['Batam Sehat'], nama: 'Pembangunan Rumah Sehat BAZNAS (RSB) Asnaf Fakir' },
            { nama_program_id: progMap['Batam Sehat'], nama: 'Pembangunan Rumah Sehat BAZNAS (RSB) Asnaf Miskin' },
            { nama_program_id: progMap['Batam Sehat'], nama: 'Pembangunan Rumah Sehat BAZNAS (RSB) | DSKL' },
            { nama_program_id: progMap['Batam Sehat'], nama: 'Pembangunan Rumah Sehat BAZNAS (RSB) | Infak/Sedekah Tidak Terikat' },
            { nama_program_id: progMap['Batam Sehat'], nama: 'Penyaluran Tidak Langsung Asnaf Fakir (Kesehatan)' },
            { nama_program_id: progMap['Batam Sehat'], nama: 'Penyaluran Tidak Langsung Asnaf Miskin (Kesehatan)' },

            /* ================= BATAM CERDAS ================= */
            { nama_program_id: progMap['Batam Cerdas'], nama: 'Bantuan Pendidikan Dasar dan Menengah Asnaf Fakir' },
            { nama_program_id: progMap['Batam Cerdas'], nama: 'Bantuan Pendidikan Dasar dan Menengah Asnaf Miskin' },
            { nama_program_id: progMap['Batam Cerdas'], nama: 'Bantuan Pendidikan Dasar dan Menengah | DSKL' },
            { nama_program_id: progMap['Batam Cerdas'], nama: 'Bantuan Pendidikan Dasar dan Menengah | Infak/Sedekah Tidak Terikat' },
            { nama_program_id: progMap['Batam Cerdas'], nama: 'Bantuan Pendidikan Diniyah Asnaf Miskin' },
            { nama_program_id: progMap['Batam Cerdas'], nama: 'Bantuan Pendidikan Diniyah Asnaf Sabilillah' },
            { nama_program_id: progMap['Batam Cerdas'], nama: 'Bantuan Pendidikan Diniyah | DSKL' },
            { nama_program_id: progMap['Batam Cerdas'], nama: 'Bantuan Pendidikan Diniyah | Infak/Sedekah Tidak Terikat' },
            { nama_program_id: progMap['Batam Cerdas'], nama: 'Bantuan Pendidikan Tinggi Dalam Negeri Asnaf Miskin' },
            { nama_program_id: progMap['Batam Cerdas'], nama: 'Bantuan Pendidikan Tinggi Dalam Negeri Asnaf Sabilillah' },
            { nama_program_id: progMap['Batam Cerdas'], nama: 'Bantuan Pendidikan Tinggi Dalam Negeri | DSKL' },
            { nama_program_id: progMap['Batam Cerdas'], nama: 'Bantuan Pendidikan Tinggi Dalam Negeri | Infak/Sedekah Tidak Terikat' },
            { nama_program_id: progMap['Batam Cerdas'], nama: 'Bantuan Pendidikan Tinggi Luar Negeri Asnaf Miskin' },
            { nama_program_id: progMap['Batam Cerdas'], nama: 'Bantuan Pendidikan Tinggi Luar Negeri Asnaf Sabilillah' },
            { nama_program_id: progMap['Batam Cerdas'], nama: 'Bantuan Pendidikan Tinggi Luar Negeri | DSKL' },
            { nama_program_id: progMap['Batam Cerdas'], nama: 'Bantuan Pendidikan Tinggi Luar Negeri | Infak/Sedekah Tidak Terikat' },
            { nama_program_id: progMap['Batam Cerdas'], nama: 'Bantuan Infrastruktur Pendidikan Asnaf Fakir' },
            { nama_program_id: progMap['Batam Cerdas'], nama: 'Bantuan Infrastruktur Pendidikan Asnaf Miskin' },
            { nama_program_id: progMap['Batam Cerdas'], nama: 'Bantuan Infrastruktur Pendidikan | DSKL' },
            { nama_program_id: progMap['Batam Cerdas'], nama: 'Bantuan Infrastruktur Pendidikan | Infak/Sedekah Tidak Terikat' },
            { nama_program_id: progMap['Batam Cerdas'], nama: 'Program Pembinaan dan Pengembangan Karakter dan Kompetensi Asnaf Miskin' },
            { nama_program_id: progMap['Batam Cerdas'], nama: 'Program Pembinaan dan Pengembangan Karakter dan Kompetensi Asnaf Sabilillah' },
            { nama_program_id: progMap['Batam Cerdas'], nama: 'Program Pembinaan dan Pengembangan Karakter dan Kompetensi | DSKL' },
            { nama_program_id: progMap['Batam Cerdas'], nama: 'Program Pembinaan dan Pengembangan Karakter dan Kompetensi | Infak/Sedekah Tidak Terikat' },
            { nama_program_id: progMap['Batam Cerdas'], nama: 'Penyaluran Tidak Langsung Asnaf Fakir (Pendidikan)' },
            { nama_program_id: progMap['Batam Cerdas'], nama: 'Penyaluran Tidak Langsung Asnaf Miskin (Pendidikan)' },
            { nama_program_id: progMap['Batam Cerdas'], nama: 'Penyaluran Tidak Langsung Asnaf Sabilillah (Pendidikan)' },

            /* ================= BATAM TAQWA ================= */
            { nama_program_id: progMap['Batam Taqwa'], nama: 'Bantuan Kafalah/Mukafaah Dai Asnaf Miskin' },
            { nama_program_id: progMap['Batam Taqwa'], nama: 'Bantuan Kafalah/Mukafaah Dai Asnaf Sabilillah' },
            { nama_program_id: progMap['Batam Taqwa'], nama: 'Bantuan Kafalah/Mukafaah Dai | DSKL' },
            { nama_program_id: progMap['Batam Taqwa'], nama: 'Bantuan Kafalah/Mukafaah Dai | Infak/Sedekah Tidak Terikat' },
            { nama_program_id: progMap['Batam Taqwa'], nama: 'Bantuan Perlengkapan Ibadah Asnaf Sabilillah' },
            { nama_program_id: progMap['Batam Taqwa'], nama: 'Bantuan Perlengkapan Ibadah | DSKL' },
            { nama_program_id: progMap['Batam Taqwa'], nama: 'Bantuan Perlengkapan Ibadah | Infak/Sedekah Tidak Terikat' },
            { nama_program_id: progMap['Batam Taqwa'], nama: 'Bantuan Syiar Dakwah Asnaf Sabilillah' },
            { nama_program_id: progMap['Batam Taqwa'], nama: 'Bantuan Syiar Dakwah | DSKL' },
            { nama_program_id: progMap['Batam Taqwa'], nama: 'Bantuan Syiar Dakwah | Infak/Sedekah Tidak Terikat' },
            { nama_program_id: progMap['Batam Taqwa'], nama: 'Bantuan Sarana Dakwah Asnaf Sabilillah' },
            { nama_program_id: progMap['Batam Taqwa'], nama: 'Bantuan Sarana Dakwah | DSKL' },
            { nama_program_id: progMap['Batam Taqwa'], nama: 'Bantuan Sarana Dakwah | Infak/Sedekah Tidak Terikat' },
            { nama_program_id: progMap['Batam Taqwa'], nama: 'Program Pembinaan, Pendampingan, dan Advokasi Mualaf Asnaf Mualaf' },
            { nama_program_id: progMap['Batam Taqwa'], nama: 'Program Pembinaan, Pendampingan, dan Advokasi Mualaf | DSKL' },
            { nama_program_id: progMap['Batam Taqwa'], nama: 'Program Pembinaan, Pendampingan, dan Advokasi Mualaf | Infak/Sedekah Tidak Terikat' },
            { nama_program_id: progMap['Batam Taqwa'], nama: 'Program Advokasi Riqab Asnaf Riqab' },
            { nama_program_id: progMap['Batam Taqwa'], nama: 'Program Advokasi Riqab | DSKL' },
            { nama_program_id: progMap['Batam Taqwa'], nama: 'Program Advokasi Riqab | Infak/Sedekah Tidak Terikat' },
            { nama_program_id: progMap['Batam Taqwa'], nama: 'Program Advokasi Kaum Marjinal Asnaf Miskin' },
            { nama_program_id: progMap['Batam Taqwa'], nama: 'Program Advokasi Kaum Marjinal | DSKL' },
            { nama_program_id: progMap['Batam Taqwa'], nama: 'Program Advokasi Kaum Marjinal | Infak/Sedekah Tidak Terikat' },
            { nama_program_id: progMap['Batam Taqwa'], nama: 'Program Advokasi Pekerja Migran Asnaf Riqab' },
            { nama_program_id: progMap['Batam Taqwa'], nama: 'Program Advokasi Pekerja Migran Asnaf Ibnu Sabil' },
            { nama_program_id: progMap['Batam Taqwa'], nama: 'Program Advokasi Pekerja Migran | DSKL' },
            { nama_program_id: progMap['Batam Taqwa'], nama: 'Program Advokasi Pekerja Migran | Infak/Sedekah Tidak Terikat' },
            { nama_program_id: progMap['Batam Taqwa'], nama: 'Program Advokasi/Bantuan Hukum Asnaf Miskin' },
            { nama_program_id: progMap['Batam Taqwa'], nama: 'Program Advokasi/Bantuan Hukum Asnaf Sabilillah' },
            { nama_program_id: progMap['Batam Taqwa'], nama: 'Program Advokasi/Bantuan Hukum | DSKL' },
            { nama_program_id: progMap['Batam Taqwa'], nama: 'Program Advokasi/Bantuan Hukum | Infak/Sedekah Tidak Terikat' },
            { nama_program_id: progMap['Batam Taqwa'], nama: 'Bantuan Renovasi/Operasional pada Masjid/Mushola/Yayasan Asnaf Sabilillah' },
            { nama_program_id: progMap['Batam Taqwa'], nama: 'Bantuan Renovasi/Operasional pada Masjid/Mushola/Yayasan | DSKL' },
            { nama_program_id: progMap['Batam Taqwa'], nama: 'Bantuan Renovasi/Operasional pada Masjid/Mushola/Yayasan | Infak/Sedekah Tidak Terikat' },
            { nama_program_id: progMap['Batam Taqwa'], nama: 'Pengembangan Kebijakan Publik dan Kajian Strategis Asnaf Sabilillah' },
            { nama_program_id: progMap['Batam Taqwa'], nama: 'Pengembangan Kebijakan Publik dan Kajian Strategis | DSKL' },
            { nama_program_id: progMap['Batam Taqwa'], nama: 'Pengembangan Kebijakan Publik dan Kajian Strategis | Infak/Sedekah Tidak Terikat' },
            { nama_program_id: progMap['Batam Taqwa'], nama: 'Penyaluran Tidak Langsung Asnaf Miskin (Dakwah-Advokasi)' },
            { nama_program_id: progMap['Batam Taqwa'], nama: 'Penyaluran Tidak Langsung Asnaf Riqab (Dakwah-Advokasi)' },
            { nama_program_id: progMap['Batam Taqwa'], nama: 'Penyaluran Tidak Langsung Asnaf Sabilillah (Dakwah-Advokasi)' },
            { nama_program_id: progMap['Batam Taqwa'], nama: 'Penyaluran Tidak Langsung Asnaf Ibnu Sabil (Dakwah-Advokasi)' },

            /* ================= BATAM MAKMUR ================= */
            { nama_program_id: progMap['Batam Makmur'], nama: 'Bantuan Modal Usaha Asnaf Miskin' },
            { nama_program_id: progMap['Batam Makmur'], nama: 'Bantuan Modal Usaha | DSKL' },
            { nama_program_id: progMap['Batam Makmur'], nama: 'Bantuan Modal Usaha | Infak/Sedekah Tidak Terikat' },
            { nama_program_id: progMap['Batam Makmur'], nama: 'Bantuan Pengembangan Usaha Asnaf Miskin' },
            { nama_program_id: progMap['Batam Makmur'], nama: 'Bantuan Pengembangan Usaha | DSKL' },
            { nama_program_id: progMap['Batam Makmur'], nama: 'Bantuan Pengembangan Usaha | Infak/Sedekah Tidak Terikat' },
            { nama_program_id: progMap['Batam Makmur'], nama: 'Bantuan Pengembangan Pemasaran Usaha Asnaf Miskin' },
            { nama_program_id: progMap['Batam Makmur'], nama: 'Bantuan Pengembangan Pemasaran Usaha | DSKL' },
            { nama_program_id: progMap['Batam Makmur'], nama: 'Bantuan Pengembangan Pemasaran Usaha | Infak/Sedekah Tidak Terikat' },
            { nama_program_id: progMap['Batam Makmur'], nama: 'Bantuan Keterampilan Kerja Asnaf Miskin' },
            { nama_program_id: progMap['Batam Makmur'], nama: 'Bantuan Keterampilan Kerja | DSKL' },
            { nama_program_id: progMap['Batam Makmur'], nama: 'Bantuan Keterampilan Kerja | Infak/Sedekah Tidak Terikat' },
            { nama_program_id: progMap['Batam Makmur'], nama: 'Bantuan Infrastruktur Pelatihan Keterampilan Kerja/Usaha Asnaf Miskin' },
            { nama_program_id: progMap['Batam Makmur'], nama: 'Bantuan Infrastruktur Pelatihan Keterampilan Kerja/Usaha | DSKL' },
            { nama_program_id: progMap['Batam Makmur'], nama: 'Bantuan Infrastruktur Pelatihan Keterampilan Kerja/Usaha | Infak/Sedekah Tidak Terikat' },
            { nama_program_id: progMap['Batam Makmur'], nama: 'Program Zakat Community Development Asnaf Miskin' },
            { nama_program_id: progMap['Batam Makmur'], nama: 'Program Zakat Community Development | DSKL' },
            { nama_program_id: progMap['Batam Makmur'], nama: 'Program Zakat Community Development | Infak/Sedekah Tidak Terikat' },
            { nama_program_id: progMap['Batam Makmur'], nama: 'Program Pemberdayaan Peternak (Balai Ternak) Asnaf Miskin' },
            { nama_program_id: progMap['Batam Makmur'], nama: 'Program Pemberdayaan Peternak (Balai Ternak) | DSKL' },
            { nama_program_id: progMap['Batam Makmur'], nama: 'Program Pemberdayaan Peternak (Balai Ternak) | Infak/Sedekah Tidak Terikat' },
            { nama_program_id: progMap['Batam Makmur'], nama: 'Program Pemberdayaan Petani (Lumbung Pangan) Asnaf Miskin' },
            { nama_program_id: progMap['Batam Makmur'], nama: 'Program Pemberdayaan Petani (Lumbung Pangan) | DSKL' },
            { nama_program_id: progMap['Batam Makmur'], nama: 'Program Pemberdayaan Petani (Lumbung Pangan) | Infak/Sedekah Tidak Terikat' },
            { nama_program_id: progMap['Batam Makmur'], nama: 'Program Pemberdayaan Retail (Z-Mart) Asnaf Miskin' },
            { nama_program_id: progMap['Batam Makmur'], nama: 'Program Pemberdayaan Retail (Z-Mart) | DSKL' },
            { nama_program_id: progMap['Batam Makmur'], nama: 'Program Pemberdayaan Retail (Z-Mart) | Infak/Sedekah Tidak Terikat' },
            { nama_program_id: progMap['Batam Makmur'], nama: 'Program Pemberdayaan Retail Pangan (Z-Chicken) Asnaf Miskin' },
            { nama_program_id: progMap['Batam Makmur'], nama: 'Program Pemberdayaan Retail Pangan (Z-Chicken) | DSKL' },
            { nama_program_id: progMap['Batam Makmur'], nama: 'Program Pemberdayaan Retail Pangan (Z-Chicken) | Infak/Sedekah Tidak Terikat' },
            { nama_program_id: progMap['Batam Makmur'], nama: 'Program Pemberdayaan Retail Bengkel (Z-Auto) Asnaf Miskin' },
            { nama_program_id: progMap['Batam Makmur'], nama: 'Program Pemberdayaan Retail Bengkel (Z-Auto) | DSKL' },
            { nama_program_id: progMap['Batam Makmur'], nama: 'Program Pemberdayaan Retail Bengkel (Z-Auto) | Infak/Sedekah Tidak Terikat' },
            { nama_program_id: progMap['Batam Makmur'], nama: 'Pembiayaan Zakat Mikro Asnaf Miskin' },
            { nama_program_id: progMap['Batam Makmur'], nama: 'Pembiayaan Zakat Mikro | DSKL' },
            { nama_program_id: progMap['Batam Makmur'], nama: 'Pembiayaan Zakat Mikro | Infak/Sedekah Tidak Terikat' },
            { nama_program_id: progMap['Batam Makmur'], nama: 'Optimasi dan Pemasaran Produk Usaha Asnaf Miskin' },
            { nama_program_id: progMap['Batam Makmur'], nama: 'Optimasi dan Pemasaran Produk Usaha | DSKL' },
            { nama_program_id: progMap['Batam Makmur'], nama: 'Optimasi dan Pemasaran Produk Usaha | Infak/Sedekah Tidak Terikat' },
            { nama_program_id: progMap['Batam Makmur'], nama: 'Program Santripreneur Asnaf Miskin' },
            { nama_program_id: progMap['Batam Makmur'], nama: 'Program Santripreneur | DSKL' },
            { nama_program_id: progMap['Batam Makmur'], nama: 'Program Santripreneur | Infak/Sedekah Tidak Terikat' },
            { nama_program_id: progMap['Batam Makmur'], nama: 'Penyaluran Tidak Langsung Asnaf Miskin (Ekonomi)' }
        ];

        await queryInterface.bulkInsert('ref_sub_program', subPrograms.map(s => ({
            ...s,
            is_active: 1,
            created_at: new Date(),
            updated_at: new Date()
        })), { ignoreDuplicates: true });

        // 4. Map Sub-Program Names to IDs
        const [subRows] = await queryInterface.sequelize.query(
            `SELECT id, nama FROM ref_sub_program`
        );
        const subMap = {};
        subRows.forEach(s => { subMap[s.nama] = s.id; });

        // 5. Seed ref_program_kegiatan
        const kegiatanData = [
            // Sembako
            { k: 'B. Sembako', s: 'Bantuan Makanan Asnaf Fakir' },
            { k: 'B. Sembako', s: 'Bantuan Makanan Asnaf Miskin' },

            // Daging Qurban
            { k: 'B. Daging Qurban', s: 'Bantuan Makanan | DSKL' },

            // Biaya Hidup
            { k: 'Biaya Hidup Sehari-hari', s: 'Bantuan Biaya Hidup Asnaf Fakir' },

            { k: 'B. Nafkah Rutin', s: 'Bantuan Biaya Hidup Asnaf Miskin' },
            { k: 'B. Biaya Hidup Sehari-hari', s: 'Bantuan Biaya Hidup Asnaf Miskin' },
            { k: 'B. Zakat Fitrah (Sembako)', s: 'Bantuan Biaya Hidup Asnaf Miskin' },
            { k: 'B. Zakat Fitrah (Uang)', s: 'Bantuan Biaya Hidup Asnaf Miskin' },

            { k: 'B. Pemulangan Ibnusabil', s: 'Bantuan Biaya Hidup Asnaf Riqab' },

            // Penyaluran Fitrah
            { k: 'Penyaluran Zakat Fitrah', s: 'Bantuan Penyaluran Fitrah Asnaf Fakir' },
            { k: 'Penyaluran Zakat Fitrah', s: 'Bantuan Penyaluran Fitrah Asnaf Miskin' },

            // Qurban
            { k: 'B. Qurban', s: 'Bantuan Penyaluran Kurban' },

            // RTLH
            { k: 'RTLH', s: 'Rumah Tinggal Layak Huni Asnaf Fakir' },
            { k: 'RTLH', s: 'Rumah Tinggal Layak Huni Asnaf Miskin' },

            // Bencana
            { k: 'Donasi Bencana', s: 'Respon Darurat Bencana Asnaf Fakir' },
            { k: 'Donasi Bencana', s: 'Respon Darurat Bencana | DSKL' },

            // Khitan
            { k: 'Khitan Masal', s: 'Khitanan Masal Asnaf Miskin' },

            // Hutang
            { k: 'Pembayaran Hutang', s: 'Bantuan Pelunasan Utang Asnaf Gharimin' },

            // Berobat
            { k: 'Berobat', s: 'Bantuan Pengobatan Asnaf Fakir' },
            { k: 'Berobat', s: 'Bantuan Pengobatan Asnaf Miskin' },

            // Pendidikan Dasar Fakir
            { k: 'B. Masuk SD', s: 'Bantuan Pendidikan Dasar dan Menengah Asnaf Fakir' },
            { k: 'B. Masuk SMP', s: 'Bantuan Pendidikan Dasar dan Menengah Asnaf Fakir' },

            // Pendidikan Dasar Miskin
            { k: 'B. Tunggakan SD', s: 'Bantuan Pendidikan Dasar dan Menengah Asnaf Miskin' },
            { k: 'B. Tunggakan SMP', s: 'Bantuan Pendidikan Dasar dan Menengah Asnaf Miskin' },
            { k: 'B. Masuk SD', s: 'Bantuan Pendidikan Dasar dan Menengah Asnaf Miskin' },
            { k: 'B. Masuk SMP', s: 'Bantuan Pendidikan Dasar dan Menengah Asnaf Miskin' },
            { k: 'B. Beasiswa SD', s: 'Bantuan Pendidikan Dasar dan Menengah Asnaf Miskin' },
            { k: 'B. Beasiswa SMP', s: 'Bantuan Pendidikan Dasar dan Menengah Asnaf Miskin' },

            // Dakwah
            { k: 'Bantuan Santri TPQ', s: 'Bantuan Kafalah/Mukafaah Dai Asnaf Sabilillah' },
            { k: 'Insentif Dai', s: 'Bantuan Kafalah/Mukafaah Dai Asnaf Sabilillah' },

            { k: 'Sinergi Dakwah', s: 'Bantuan Syiar Dakwah Asnaf Sabilillah' },

            { k: 'Mualaf', s: 'Program Pembinaan, Pendampingan, dan Advokasi Mualaf Asnaf Mualaf' },

            // Sumur
            { k: 'Sumur Bor', s: 'Bantuan Sumur Air | DSKL' },

            // Kesehatan
            { k: 'Operasional RIB', s: 'Bantuan Operasional Fasilitas Kesehatan Asnaf Miskin' },
            { k: 'Bantuan Penyuluhan', s: 'Bantuan Edukasi/Promosi Kesehatan Asnaf Miskin' },
            { k: 'Stunting', s: 'Pencegahan dan Penanggulangan Stunting Asnaf Miskin' },

            // Kuliah
            { k: 'Bantuan Masuk Kuliah', s: 'Bantuan Pendidikan Tinggi Dalam Negeri Asnaf Miskin' },
            { k: 'Bantuan Masuk Kuliah', s: 'Bantuan Pendidikan Tinggi Dalam Negeri Asnaf Sabilillah' },
            { k: 'Bantuan Masuk Kuliah', s: 'Bantuan Pendidikan Tinggi Luar Negeri Asnaf Miskin' },
            { k: 'Bantuan Masuk Kuliah', s: 'Bantuan Pendidikan Tinggi Luar Negeri Asnaf Sabilillah' },

            // Ekonomi
            { k: 'Modal Usaha', s: 'Bantuan Modal Usaha Asnaf Miskin' },
            { k: 'UMKM', s: 'Bantuan Pengembangan Usaha Asnaf Miskin' },
            { k: 'Pelatihan', s: 'Bantuan Keterampilan Kerja Asnaf Miskin' },
        ];

        const rows = kegiatanData.map(d => ({
            sub_program_id: subMap[d.s],
            nama: d.k,
            is_active: 1,
            created_at: new Date(),
            updated_at: new Date()
        })).filter(r => r.sub_program_id);

        await queryInterface.bulkInsert('ref_program_kegiatan', rows, { ignoreDuplicates: true });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('ref_program_kegiatan', null, {});
        await queryInterface.bulkDelete('ref_sub_program', null, {});
    }
};

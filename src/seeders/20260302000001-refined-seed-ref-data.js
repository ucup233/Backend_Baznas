'use strict';

/** @type {import('sequelize-cli').Seeder} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Disable FK checks to allow clean truncate/delete of reference data
        await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');

        // 1. CLEAR OLD DATA
        await queryInterface.bulkDelete('ref_jenis_upz', null, {});
        await queryInterface.bulkDelete('ref_jenis_zis', null, {});
        await queryInterface.bulkDelete('ref_jenis_zis_distribusi', null, {});
        await queryInterface.bulkDelete('ref_zis', null, {});

        // Clear specific methods for Kantor Digital
        const [viaRowsKD] = await queryInterface.sequelize.query(
            `SELECT id FROM ref_via_penerimaan WHERE nama = 'Kantor Digital' LIMIT 1`
        );
        if (viaRowsKD.length > 0) {
            await queryInterface.bulkDelete('ref_metode_bayar', { via_penerimaan_id: viaRowsKD[0].id }, {});
        }

        // 2. RE-SEED DATA

        // 2.1 ref_jenis_upz
        const jenisUpz = [
            'Individu', 'Instansi', 'Sekolah', 'Masjid', 'Perusahaan', 'kantor',
            'Majelis Taklim', 'TPQ', 'Universitas', 'Rumah Makan / Warung/Komunitas',
            'Dai', 'BKMT', 'BP BATAM', 'KEMENAG', 'PMB', 'ASN PEMKO', 'BMGQ', 'IPIM',
            'DPRD', 'UMKM', 'BKPRMI', 'Guru Swasta', 'BANK', 'DMI', 'BAZNAS Batam', 'HBMI'
        ];
        await queryInterface.bulkInsert('ref_jenis_upz',
            jenisUpz.map(nama => ({ nama, created_at: new Date(), updated_at: new Date() })),
            { ignoreDuplicates: true }
        );

        // 2.2 ref_zis (Main categories)
        const zisCategories = [
            'Zakat', 'Infak/Sedekah', 'Fidyah', 'DSKL / CSR / Hibah'
        ];
        await queryInterface.bulkInsert('ref_zis',
            zisCategories.map(nama => ({ nama, created_at: new Date(), updated_at: new Date() })),
            { ignoreDuplicates: true }
        );

        // Get ZIS IDs for mapping
        const [zisRows] = await queryInterface.sequelize.query(`SELECT id, nama FROM ref_zis`);
        const zisMap = {};
        zisRows.forEach(r => { zisMap[r.nama] = r.id; });

        // 2.3 ref_jenis_zis (Detailed types)
        const jenisZis = [
            { nama: 'Infak Terikat', parent: 'Infak/Sedekah' },
            { nama: 'Infak Tidak Terikat', parent: 'Infak/Sedekah' },
            { nama: 'Zakat Fitrah', parent: 'Zakat' },
            { nama: 'Fidyah', parent: 'Fidyah' },
            { nama: 'Infak Kifarat', parent: 'Infak/Sedekah' },
            { nama: 'Hibah', parent: 'DSKL / CSR / Hibah' },
            { nama: 'Infak Kenclengan', parent: 'Infak/Sedekah' },
            { nama: 'Infak Voucher', parent: 'Infak/Sedekah' },
            { nama: 'Infak Smart 5000', parent: 'Infak/Sedekah' },
            { nama: 'Infak Indonesia Peduli', parent: 'Infak/Sedekah' },
            { nama: 'DSKL', parent: 'DSKL / CSR / Hibah' },
            { nama: 'CSR', parent: 'DSKL / CSR / Hibah' },
            { nama: 'Infak Sembako', parent: 'Infak/Sedekah' },
            { nama: 'Infak Quran', parent: 'Infak/Sedekah' },
            { nama: 'Infak Khitan', parent: 'Infak/Sedekah' },
            { nama: 'Infak Santri', parent: 'Infak/Sedekah' },
            { nama: 'Zakat Maal', parent: 'Zakat' },
            { nama: 'Infak Seribu', parent: 'Infak/Sedekah' },
            { nama: 'Infak Palestina', parent: 'Infak/Sedekah' },
            { nama: 'Infak Kurban', parent: 'Infak/Sedekah' },
            { nama: 'Infak Jumat', parent: 'Infak/Sedekah' },
            { nama: 'Infak Sumur Bor', parent: 'Infak/Sedekah' },
            { nama: 'Infak Pendidikan', parent: 'Infak/Sedekah' },
            { nama: 'Infak Subuh', parent: 'Infak/Sedekah' },
            { nama: 'Infak Lebaran', parent: 'Infak/Sedekah' },
            { nama: 'Infak Z-volt', parent: 'Infak/Sedekah' },
            { nama: 'Infak Renovasi Masjid/Musholla/TPQ', parent: 'Infak/Sedekah' },
            { nama: 'Infak Perahu Dakwah', parent: 'Infak/Sedekah' }
        ];

        await queryInterface.bulkInsert('ref_jenis_zis',
            jenisZis.map(item => ({
                zis_id: zisMap[item.parent] || zisMap['Zakat'],
                nama: item.nama,
                created_at: new Date(),
                updated_at: new Date()
            })),
            { ignoreDuplicates: true }
        );

        // 2.4 ref_jenis_zis_distribusi
        const zisDistribusi = [
            'Zakat', 'Infak Terikat', 'Infak Tidak Terikat'
        ];
        await queryInterface.bulkInsert('ref_jenis_zis_distribusi',
            zisDistribusi.map(nama => ({ nama, created_at: new Date(), updated_at: new Date() })),
            { ignoreDuplicates: true }
        );

        // 5. ref_metode_bayar (Linked to 'Kantor Digital')
        if (viaRowsKD.length > 0) {
            const viaId = viaRowsKD[0].id;
            const metodeBayarKD = [
                'Bank Mandiri', 'Bank Riau Kepri', 'Bank Riau Syariah', 'BNI', 'Bank BSI 2025',
                'BTN Syariah Zakat', 'BTN Syariah Infak', 'Bank Muamalat', 'BSI Zakat',
                'BSI Infaq', 'Bank BRI', 'Bank BRI Syariah', 'Bank OCBC Syariah',
                'Bank BCA', 'BSI 2025'
            ];

            await queryInterface.bulkInsert('ref_metode_bayar',
                metodeBayarKD.map(nama => ({
                    nama,
                    via_penerimaan_id: viaId,
                    created_at: new Date(),
                    updated_at: new Date()
                })),
                { ignoreDuplicates: true }
            );
        }

        // 6. ref_nama_entitas
        await queryInterface.bulkDelete('ref_nama_entitas', null, {});
        const namaEntitas = [
            'Individu', 'Kelompok', 'BAZNAS KOTA BATAM', 'Rumah Sehat Baznas', 'Baznas Tanggap Bencana (BTB)'
        ];
        await queryInterface.bulkInsert('ref_nama_entitas',
            namaEntitas.map(nama => ({ nama, created_at: new Date(), updated_at: new Date() })),
            { ignoreDuplicates: true }
        );

        // Enable FK checks back
        await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
    },

    async down(queryInterface, Sequelize) {
        // Usually no undo needed for cleanup seeder
    }
};

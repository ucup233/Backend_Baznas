'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Helper to add index only if it doesn't exist
        const addIndexSafe = async (table, columns, options) => {
            try {
                const [results] = await queryInterface.sequelize.query(
                    `SHOW INDEX FROM ${table} WHERE Key_name = '${options.name}'`
                );
                if (results.length === 0) {
                    await queryInterface.addIndex(table, columns, options);
                }
            } catch (err) {
                console.log(`Skipping index ${options.name} on ${table}: ${err.message}`);
            }
        };

        // 1. Muzakki Performance Indexes
        await addIndexSafe('muzakki', ['jenis_muzakki_id', 'status'], { name: 'muzakki_filter_idx' });
        await addIndexSafe('muzakki', ['kecamatan_id', 'kelurahan_id'], { name: 'muzakki_location_idx' });

        // 2. Penerimaan Performance Indexes
        await addIndexSafe('penerimaan', ['zis_id', 'jenis_zis_id'], { name: 'penerimaan_zis_idx' });
        await addIndexSafe('penerimaan', ['via_id', 'metode_bayar_id'], { name: 'penerimaan_payment_idx' });
        await addIndexSafe('penerimaan', ['muzakki_id', 'tanggal'], { name: 'penerimaan_muzakki_history_idx' });

        // 3. Distribusi Performance Indexes
        await addIndexSafe('distribusi', ['nama_program_id', 'status'], { name: 'distribusi_program_status_idx' });
        await addIndexSafe('distribusi', ['asnaf_id', 'nama_entitas_id'], { name: 'distribusi_asnaf_entitas_idx' });
        await addIndexSafe('distribusi', ['mustahiq_id', 'tanggal'], { name: 'distribusi_mustahiq_history_idx' });

        // 4. Reference Tables
        const refTables = [
            'ref_kelurahan', 'ref_kecamatan', 'ref_asnaf', 'ref_jenis_muzakki',
            'ref_jenis_upz', 'ref_jenis_zis', 'ref_kategori_mustahiq',
            'ref_via_penerimaan', 'ref_metode_bayar', 'ref_nama_program',
            'ref_sub_program', 'ref_program_kegiatan',
            'ref_nama_entitas'
        ];

        for (const table of refTables) {
            await addIndexSafe(table, ['is_active'], { name: `${table}_active_idx` });
        }
    },

    async down(queryInterface, Sequelize) {
        const removeIndexSafe = async (table, name) => {
            try {
                const [results] = await queryInterface.sequelize.query(
                    `SHOW INDEX FROM ${table} WHERE Key_name = '${name}'`
                );
                if (results.length > 0) {
                    await queryInterface.removeIndex(table, name);
                }
            } catch (err) {
                console.log(`Skipping removal of index ${name} on ${table}: ${err.message}`);
            }
        };

        await removeIndexSafe('muzakki', 'muzakki_filter_idx');
        await removeIndexSafe('muzakki', 'muzakki_location_idx');
        await removeIndexSafe('penerimaan', 'penerimaan_zis_idx');
        await removeIndexSafe('penerimaan', 'penerimaan_payment_idx');
        await removeIndexSafe('penerimaan', 'penerimaan_muzakki_history_idx');
        await removeIndexSafe('distribusi', 'distribusi_program_status_idx');
        await removeIndexSafe('distribusi', 'distribusi_asnaf_entitas_idx');
        await removeIndexSafe('distribusi', 'distribusi_mustahiq_history_idx');

        const refTables = [
            'ref_kelurahan', 'ref_kecamatan', 'ref_asnaf', 'ref_jenis_muzakki',
            'ref_jenis_upz', 'ref_jenis_zis', 'ref_kategori_mustahiq',
            'ref_via_penerimaan', 'ref_metode_bayar', 'ref_nama_program',
            'ref_sub_program', 'ref_program_kegiatan',
            'ref_nama_entitas'
        ];

        for (const table of refTables) {
            await removeIndexSafe(table, `${table}_active_idx`);
        }
    }
};

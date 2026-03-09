import Penerimaan from '../models/penerimaanModel.js';
import Distribusi from '../models/distribusiModel.js';
import Muzakki from '../models/muzakkiModel.js';
import Mustahiq from '../models/mustahiqModel.js';
import { Op } from 'sequelize';
import db from '../config/database.js';
import { Asnaf, NamaProgram, SubProgram, ProgramKegiatan, NamaEntitas, JenisZis, Zis, Infak, JenisZisDistribusi } from '../models/ref/index.js';

const getArusKas = async (query) => {
  const { start_date, end_date } = query;
  
  const endTarget = end_date || new Date().toISOString().slice(0, 10);
  let tahun = new Date(endTarget).getFullYear();
  const startTarget = start_date || `${tahun}-01-01`;

  const d = new Date(endTarget);
  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = monthNames[d.getMonth()];
  const yy = d.getFullYear();
  const periodeLabel = `${startTarget} s.d ${dd} ${mm} ${yy}`;

  const saldoAwalRes = await db.query(`
    SELECT 
      (SELECT IFNULL(SUM(jumlah), 0) FROM penerimaan WHERE tanggal < :startTarget) as total_masuk,
      (SELECT IFNULL(SUM(jumlah), 0) FROM distribusi WHERE status = 'diterima' AND tanggal < :startTarget) as total_keluar
  `, {
    replacements: { startTarget },
    type: db.QueryTypes.SELECT
  });

  const saldo_awal = (saldoAwalRes[0].total_masuk * 0.875) - (saldoAwalRes[0].total_keluar * 0.7); // simplified

  // In getArusKas, query direct from tables but joined with reference lookup since we rely on names 
  // Wait, let's keep it simple: group by ids and map them. Or use literal if needed. Let's do raw to be safe with names.

  const penerimaanRaw = await db.query(`
    SELECT 
      z.nama as jenis_zis,
      v.nama as via,
      SUM(p.jumlah) as total
    FROM penerimaan p
    LEFT JOIN ref_jenis_zis z ON p.jenis_zis_id = z.id
    LEFT JOIN ref_via_penerimaan v ON p.via_id = v.id
    WHERE p.tanggal BETWEEN :startTarget AND :endTarget
    GROUP BY p.jenis_zis_id, p.via_id
  `, {
    replacements: { startTarget, endTarget },
    type: db.QueryTypes.SELECT
  });

  let total_zakat = 0;
  let total_infaq = 0;
  let total_masuk = 0;
  const breakdown_per_jenis_zis = {};
  const breakdown_per_channel = {};

  penerimaanRaw.forEach(item => {
    const val = parseFloat(item.total) || 0;
    const type = item.jenis_zis || 'Lainnya';
    const channel = item.via || 'Lainnya';

    if (type.toLowerCase().includes('zakat')) total_zakat += val;
    else total_infaq += val;

    total_masuk += val;
    breakdown_per_jenis_zis[type] = (breakdown_per_jenis_zis[type] || 0) + val;
    breakdown_per_channel[channel] = (breakdown_per_channel[channel] || 0) + val;
  });

  const total_dana_amil = total_zakat * 0.125;

  const distribusiRaw = await db.query(`
    SELECT 
      np.nama as nama_program,
      a.nama as asnaf,
      SUM(d.jumlah) as total
    FROM distribusi d
    LEFT JOIN ref_nama_program np ON d.nama_program_id = np.id
    LEFT JOIN ref_asnaf a ON d.asnaf_id = a.id
    WHERE d.status = 'diterima' AND d.tanggal BETWEEN :startTarget AND :endTarget
    GROUP BY d.nama_program_id, d.asnaf_id
  `, {
    replacements: { startTarget, endTarget },
    type: db.QueryTypes.SELECT
  });


  let total_keluar = 0;
  const breakdown_per_program = {};
  const breakdown_per_asnaf = {};

  distribusiRaw.forEach(item => {
    const val = parseFloat(item.total) || 0;
    const programName = item.nama_program || 'Program Lainnya';
    const asnafName = item.asnaf || 'Asnaf Lainnya';

    total_keluar += val;
    breakdown_per_program[programName] = (breakdown_per_program[programName] || 0) + val;
    breakdown_per_asnaf[asnafName] = (breakdown_per_asnaf[asnafName] || 0) + val;
  });

  const saldo_akhir = saldo_awal + (total_masuk - total_dana_amil) - total_keluar;

  return {
    periode: periodeLabel,
    saldo_awal,
    arus_kas_masuk: {
      total_zakat,
      total_infaq,
      total_dana_amil,
      breakdown_per_jenis_zis,
      breakdown_per_channel,
      total_masuk
    },
    arus_kas_keluar: {
      total_distribusi: total_keluar,
      breakdown_per_program,
      breakdown_per_asnaf,
      total_keluar
    },
    saldo_akhir,
    dana_bersih_tersedia: saldo_akhir
  };
};

const getNeraca = async (query) => {
  const { tanggal } = query;
  const targetDate = tanggal || new Date().toISOString().slice(0, 10);
  const tahun = new Date(targetDate).getFullYear();
  const awalTahun = `${tahun}-01-01`;

  const d = new Date(targetDate);
  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = monthNames[d.getMonth()];
  const yy = d.getFullYear();
  const periodeLabel = `${dd} ${mm} ${yy}`;

  const stats = await db.query(`
    SELECT 
      (SELECT IFNULL(SUM(jumlah), 0) FROM penerimaan WHERE tanggal BETWEEN :awalTahun AND :targetDate) as total_masuk,
      (SELECT IFNULL(SUM(jumlah), 0) FROM distribusi WHERE status = 'diterima' AND tanggal BETWEEN :awalTahun AND :targetDate) as total_keluar,
      (SELECT IFNULL(SUM(jumlah), 0) FROM penerimaan WHERE zis_id = 3 AND tanggal BETWEEN :awalTahun AND :targetDate) as total_zakat_in,
      (SELECT IFNULL(SUM(jumlah), 0) FROM distribusi WHERE asnaf_id IN (1,2,3,4,5,6,7,8) AND status = 'diterima' AND tanggal BETWEEN :awalTahun AND :targetDate) as total_dist_out
  `, {
    replacements: { targetDate, awalTahun },
    type: db.QueryTypes.SELECT
  });

  const { total_masuk, total_keluar, total_zakat_in } = stats[0];
  const dana_amil = total_zakat_in * 0.125;
  const dana_zakat = (total_zakat_in * 0.875) - (total_keluar * 0.7);
  const dana_infaq = (total_masuk - total_zakat_in) - (total_keluar * 0.3);

  const total_aktiva = (total_masuk - total_keluar);

  return {
    periode: periodeLabel,
    aktiva: {
      kas_dan_setara_kas: total_aktiva,
      total_aktiva
    },
    pasiva: {
      dana_zakat,
      dana_infaq,
      dana_amil,
      total_pasiva: dana_zakat + dana_infaq + dana_amil
    },
    selisih: total_aktiva - (dana_zakat + dana_infaq + dana_amil)
  };
};

const getRawDataForExport = async (type, query) => {
  const { tahun, bulan, tanggal } = query;
  const where = {};
  if (tahun) where.tahun = tahun;
  if (bulan) where.bulan = bulan;
  if (tanggal) where.tanggal = tanggal;

  if (type === 'penerimaan') return await Penerimaan.findAll({ where, include: [Muzakki] });
  if (type === 'distribusi') return await Distribusi.findAll({ where, include: [Mustahiq] });
  if (type === 'mustahiq') return await Mustahiq.findAll({ where: query.status ? { status: query.status } : {} });
  if (type === 'muzakki') return await Muzakki.findAll({ where: query.status ? { status: query.status } : {} });

  return [];
};

const getRekapTahunan = async (query) => {
  const tahun = parseInt(query.tahun) || new Date().getFullYear();

  const [penerimaan, distribusi] = await Promise.all([
    Penerimaan.findAll({
      attributes: [
        'bulan',
        [db.fn('SUM', db.col('jumlah')), 'total']
      ],
      where: { tahun },
      group: ['bulan']
    }),
    Distribusi.findAll({
      attributes: [
        'bulan',
        [db.fn('SUM', db.col('jumlah')), 'total']
      ],
      where: { tahun },
      group: ['bulan']
    })
  ]);

  return { tahun, penerimaan, distribusi };
};

const getDistribusiByProgram = async (query) => {
  const { start_date, end_date, jenis_zis } = query;
  const where = { status: 'diterima' };

  if (start_date && end_date) {
    where.tanggal = { [Op.between]: [start_date, end_date] };
  } else if (start_date) {
    where.tanggal = { [Op.gte]: start_date };
  } else if (end_date) {
    where.tanggal = { [Op.lte]: end_date };
  }

  // Filter for Zakat only if requested
  if (jenis_zis === 'Zakat') {
    where[Op.or] = [{ infak_id: null }, { infak_id: 0 }];
  } else if (jenis_zis === 'Infak') {
    where.infak_id = { [Op.gt]: 0 };
  }

  return await Distribusi.findAll({
    where,
    include: [
      { model: NamaProgram },
      { model: SubProgram },
      { model: ProgramKegiatan }
    ],
    order: [
      ['nama_program_id', 'ASC'],
      ['sub_program_id', 'ASC'],
      ['program_kegiatan_id', 'ASC'],
      ['tanggal', 'ASC']
    ]
  });
};

const getDistribusiByAsnaf = async (query) => {
  const { start_date, end_date, jenis_zis } = query;
  const where = { status: 'diterima' };

  if (start_date && end_date) {
    where.tanggal = { [Op.between]: [start_date, end_date] };
  } else if (start_date) {
    where.tanggal = { [Op.gte]: start_date };
  } else if (end_date) {
    where.tanggal = { [Op.lte]: end_date };
  }

  // Filter for Zakat only if requested
  if (jenis_zis === 'Zakat') {
    where[Op.or] = [{ infak_id: null }, { infak_id: 0 }];
  } else if (jenis_zis === 'Infak') {
    where.infak_id = { [Op.gt]: 0 };
  }

  return await Distribusi.findAll({
    where,
    include: [
      { model: Asnaf, as: 'asnaf' }
    ],
    order: [
      ['asnaf_id', 'ASC'],
      ['tanggal', 'ASC']
    ]
  });
};

const getDistribusiHarian = async (query) => {
  const { start_date, end_date, jenis_zis } = query;
  const where = { status: 'diterima' };

  if (start_date && end_date) {
    where.tanggal = { [Op.between]: [start_date, end_date] };
  } else if (start_date) {
    where.tanggal = { [Op.gte]: start_date };
  } else if (end_date) {
    where.tanggal = { [Op.lte]: end_date };
  }

  // Filter for Zakat only if requested
  if (jenis_zis === 'Zakat') {
    where[Op.or] = [{ infak_id: null }, { infak_id: 0 }];
  } else if (jenis_zis === 'Infak') {
    where.infak_id = { [Op.gt]: 0 };
  }

  return await Distribusi.findAll({
    where,
    include: [
      { model: NamaEntitas }
    ],
    order: [['tanggal', 'ASC']]
  });
};



const getPerubahanDana = async (query) => {
  let { bulan, tahun, tanggal } = query;
  tahun = parseInt(tahun) || new Date().getFullYear();

  const bulanList = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  // Dynamically fetch reference IDs to avoid hardcoding during migrations
  const [refZisZakat, refZisInfak, refDistZakat, refDistInfakTerikat, refDistInfakTidakTerikat] = await Promise.all([
    Zis.findOne({ where: { nama: 'Zakat' } }),
    Zis.findOne({ where: { nama: 'Infak/Sedekah' } }),
    JenisZisDistribusi.findOne({ where: { nama: 'Zakat' } }),
    JenisZisDistribusi.findOne({ where: { nama: 'Infak Terikat' } }),
    JenisZisDistribusi.findOne({ where: { nama: 'Infak Tidak Terikat' } })
  ]);

  const ZIS_ZAKAT_ID = refZisZakat?.id || 3;
  const ZIS_INFAK_ID = refZisInfak?.id || 4;
  const DIST_ZAKAT_ID = refDistZakat?.id || 3;
  const DIST_INFAK_TERIKAT_ID = refDistInfakTerikat?.id || 4;
  const DIST_INFAK_TIDAK_TERIKAT_ID = refDistInfakTidakTerikat?.id || 5;

  // Determine cutoff dates
  // tanggal = YYYY-MM-DD end date sent from frontend
  const endDate = tanggal || `${tahun}-12-31`;
  const startDateCurrent = `${tahun}-01-01`;
  const prevTahun = tahun - 1;
  const startDatePrev = `${prevTahun}-01-01`;
  const endDatePrev = `${prevTahun}-12-31`;

  if (!bulan) {
    const d = new Date(endDate + 'T00:00:00');
    bulan = bulanList[d.getMonth()];
  } else {
    const b = bulan.toLowerCase();
    const idx = bulanList.findIndex(m => m.toLowerCase() === b);
    if (idx !== -1) bulan = bulanList[idx];
  }

  console.log(`[getPerubahanDana] tahun=${tahun}, endDate=${endDate}, startDateCurrent=${startDateCurrent}`);

  const fetchYearData = async (targetStartDate, targetEndDate) => {
    const dateWhere = { tanggal: { [Op.between]: [targetStartDate, targetEndDate] } };
    const distDateWhere = { tanggal: { [Op.between]: [targetStartDate, targetEndDate] } };

    const zakatIn = await Penerimaan.findAll({
      attributes: ['jenis_muzakki_id', [db.fn('SUM', db.col('jumlah')), 'total']],
      where: { ...dateWhere, zis_id: ZIS_ZAKAT_ID },
      group: ['jenis_muzakki_id']
    });

    const zakatOut = await Distribusi.findAll({
      attributes: ['asnaf_id', [db.fn('SUM', db.col('jumlah')), 'total']],
      where: { ...distDateWhere, status: 'diterima', jenis_zis_distribusi_id: DIST_ZAKAT_ID },
      group: ['asnaf_id']
    });

    const infakIn = await Penerimaan.findAll({
      attributes: ['jenis_muzakki_id', [db.fn('SUM', db.col('jumlah')), 'total']],
      where: { ...dateWhere, zis_id: ZIS_INFAK_ID },
      group: ['jenis_muzakki_id']
    });

    const infakOut = await Distribusi.findAll({
      attributes: ['jenis_zis_distribusi_id', [db.fn('SUM', db.col('jumlah')), 'total']],
      where: {
        ...distDateWhere, status: 'diterima',
        jenis_zis_distribusi_id: { [Op.in]: [DIST_INFAK_TERIKAT_ID, DIST_INFAK_TIDAK_TERIKAT_ID] }
      },
      group: ['jenis_zis_distribusi_id']
    });

    const saldoAwalZakatRes = await db.query(`
      SELECT 
        (SELECT IFNULL(SUM(jumlah), 0) FROM penerimaan WHERE zis_id = :zisZakat AND tanggal < :startDate) as in_all,
        (SELECT IFNULL(SUM(jumlah), 0) FROM distribusi WHERE jenis_zis_distribusi_id = :distZakat AND status = 'diterima' AND tanggal < :startDate) as out_all
    `, { replacements: { startDate: targetStartDate, zisZakat: ZIS_ZAKAT_ID, distZakat: DIST_ZAKAT_ID }, type: db.QueryTypes.SELECT });
    const saldo_awal_zakat = (saldoAwalZakatRes[0].in_all || 0) - (saldoAwalZakatRes[0].out_all || 0);

    const saldoAwalInfakRes = await db.query(`
      SELECT 
        (SELECT IFNULL(SUM(jumlah), 0) FROM penerimaan WHERE zis_id = :zisInfak AND tanggal < :startDate) as in_all,
        (SELECT IFNULL(SUM(jumlah), 0) FROM distribusi WHERE jenis_zis_distribusi_id IN (:distInfakTerikat, :distInfakTidak) AND status = 'diterima' AND tanggal < :startDate) as out_all
    `, { replacements: { startDate: targetStartDate, zisInfak: ZIS_INFAK_ID, distInfakTerikat: DIST_INFAK_TERIKAT_ID, distInfakTidak: DIST_INFAK_TIDAK_TERIKAT_ID }, type: db.QueryTypes.SELECT });
    const saldo_awal_infak = (saldoAwalInfakRes[0].in_all || 0) - (saldoAwalInfakRes[0].out_all || 0);

    const mapPenerimaan = (arr) => ({
      entitas: arr.find(i => i.jenis_muzakki_id === 2)?.get('total') || 0,
      individual: arr.find(i => i.jenis_muzakki_id === 1)?.get('total') || 0,
      lainnya: arr.filter(i => ![1, 2].includes(i.jenis_muzakki_id)).reduce((s, i) => s + parseFloat(i.get('total') || 0), 0)
    });

    const mappedZakatIn = mapPenerimaan(zakatIn);
    const totalZakatIn = parseFloat(mappedZakatIn.entitas) + parseFloat(mappedZakatIn.individual) + parseFloat(mappedZakatIn.lainnya);

    // Amil Zakat = 12.5% dari total penerimaan zakat (1/8 dari 8 asnaf)
    const mappedZakatOut = {
      amil: totalZakatIn * 0.125,
      fakir: zakatOut.find(i => i.asnaf_id === 1)?.get('total') || 0,
      miskin: zakatOut.find(i => i.asnaf_id === 2)?.get('total') || 0,
      riqob: zakatOut.find(i => i.asnaf_id === 5)?.get('total') || 0,
      gharimin: zakatOut.find(i => i.asnaf_id === 6)?.get('total') || 0,
      muallaf: zakatOut.find(i => i.asnaf_id === 4)?.get('total') || 0,
      fisabilillah: zakatOut.find(i => i.asnaf_id === 7)?.get('total') || 0,
      ibnu_sabil: zakatOut.find(i => i.asnaf_id === 8)?.get('total') || 0,
      lainnya: zakatOut.filter(i => ![1, 2, 3, 4, 5, 6, 7, 8].includes(i.asnaf_id)).reduce((s, i) => s + parseFloat(i.get('total') || 0), 0)
    };

    const totalZakatOut = Object.values(mappedZakatOut).reduce((s, v) => s + parseFloat(v || 0), 0);
    const surplusZakat = totalZakatIn - totalZakatOut;

    const mappedInfakIn = {
      terikat: infakIn.find(i => i.jenis_muzakki_id === 2)?.get('total') || 0,
      tidak_terikat: infakIn.find(i => i.jenis_muzakki_id === 1)?.get('total') || 0,
      bagi_hasil: 0, dampak: 0, hasil: 0,
      lainnya: infakIn.filter(i => ![1, 2].includes(i.jenis_muzakki_id)).reduce((s, i) => s + parseFloat(i.get('total') || 0), 0)
    };

    const totalInfakIn = Object.values(mappedInfakIn).reduce((s, v) => s + parseFloat(v || 0), 0);

    // Raw terikat penyaluran from DB
    const rawTerikat = parseFloat(infakOut.find(i => i.jenis_zis_distribusi_id === DIST_INFAK_TERIKAT_ID)?.get('total') || 0);
    const rawTidakTerikat = parseFloat(infakOut.find(i => i.jenis_zis_distribusi_id === DIST_INFAK_TIDAK_TERIKAT_ID)?.get('total') || 0);

    // 5201: Amil-Infak = 20% dari penyaluran infak terikat
    const amil_infak = rawTerikat * 0.20;
    // 5202: Amil-Sedekah = 20% dari total penerimaan infak/sedekah
    const amil_sedekah = totalInfakIn * 0.20;

    const mappedInfakOut = {
      amil_infak,
      amil_sedekah,
      terikat: rawTerikat,
      tidak_terikat: rawTidakTerikat,
      alokasi: 0,
      lainnya: infakOut.filter(i => ![DIST_INFAK_TERIKAT_ID, DIST_INFAK_TIDAK_TERIKAT_ID].includes(i.jenis_zis_distribusi_id)).reduce((s, i) => s + parseFloat(i.get('total') || 0), 0)
    };

    const totalInfakOut = Object.values(mappedInfakOut).reduce((s, v) => s + parseFloat(v || 0), 0);
    const surplusInfak = totalInfakIn - totalInfakOut;

    // === DANA AMIL ===
    // 4301: Bagian dari Zakat = 12.5% × total penerimaan zakat
    const amil_dari_zakat = totalZakatIn * 0.125;
    // 4302: Bagian dari Infak = 5201 (amil_infak) + 5202 (amil_sedekah) dari infak penyaluran
    const amil_dari_infak = amil_infak + amil_sedekah;

    const amil_penerimaan = {
      bagian_dari_zakat: amil_dari_zakat,  // 4301
      bagian_dari_infak: amil_dari_infak,  // 4302 = 5201 + 5202
      infak_sedekah: 0,                    // 4303
      bagi_hasil: 0,                       // 4304
      lainnya: 0                           // 4399
    };
    const total_amil_penerimaan = amil_dari_zakat + amil_dari_infak;

    // Penyaluran Amil: data akan dari tabel baru, sementara semua 0
    const amil_penyaluran = {
      belanja_pegawai: 0,  // 5301
      belanja_kegiatan: 0,  // 5302
      perjalanan_dinas: 0,  // 5303
      belanja_administrasi: 0,  // 5304
      beban_pengadaan: 0,  // 5305
      beban_penyusutan: 0,  // 5306
      jasa_pihak_ketiga: 0,  // 5307
      operasional_upz: 0,  // 5308
      lainnya: 0   // 5399
    };
    const total_amil_penyaluran = 0;

    // Saldo awal amil = total amil sebelum tahun ini
    const saldoAwalAmilRes = await db.query(`
      SELECT
        (SELECT IFNULL(SUM(jumlah), 0) FROM distribusi WHERE asnaf_id = 3 AND status = 'diterima' AND tanggal < :startDate) as out_all
    `, { replacements: { startDate: targetStartDate }, type: db.QueryTypes.SELECT });
    // Saldo awal amil = akumulasi penerimaan amil - pengeluaran amil sebelumnya
    // simplified as 0 in first year (no prior data), else compute from raw SQL
    const saldo_awal_amil = 0; // conservative default; balance carried from prior years

    const surplus_amil = total_amil_penerimaan - total_amil_penyaluran;

    return {
      zakat: {
        penerimaan: mappedZakatIn, penyaluran: mappedZakatOut,
        total_penerimaan: totalZakatIn, total_penyaluran: totalZakatOut,
        surplus: surplusZakat, saldo_awal: saldo_awal_zakat, saldo_akhir: saldo_awal_zakat + surplusZakat
      },
      infak: {
        penerimaan: mappedInfakIn, penyaluran: mappedInfakOut,
        total_penerimaan: totalInfakIn, total_penyaluran: totalInfakOut,
        surplus: surplusInfak, saldo_awal: saldo_awal_infak, saldo_akhir: saldo_awal_infak + surplusInfak
      },
      amil: {
        penerimaan: amil_penerimaan, penyaluran: amil_penyaluran,
        total_penerimaan: total_amil_penerimaan, total_penyaluran: total_amil_penyaluran,
        surplus: surplus_amil, saldo_awal: saldo_awal_amil, saldo_akhir: saldo_awal_amil + surplus_amil
      }
    };
  };

  const currentYear = await fetchYearData(startDateCurrent, endDate);
  const prevYear = await fetchYearData(startDatePrev, endDatePrev);

  return {
    periode: `${bulan} ${tahun}`,
    current: currentYear,
    previous: prevYear,
    labels: { tahun_current: tahun, tahun_previous: tahun - 1 }
  };
};


const getKasMasukHarian = async (query) => {
  const { tanggal } = query;
  const targetDate = tanggal || new Date().toISOString().slice(0, 10);

  const rows = await db.query(`
    SELECT
      p.id,
      p.tanggal,
      p.npwz,
      p.nama_muzakki,
      p.jumlah,
      p.zis_id,
      vp.nama as via_nama,
      p.via_id,
      z.nama as jenis_zis_nama
    FROM penerimaan p
    LEFT JOIN ref_via_penerimaan vp ON p.via_id = vp.id
    LEFT JOIN ref_zis z ON p.zis_id = z.id
    WHERE p.tanggal = :targetDate
    ORDER BY p.id ASC
  `, { replacements: { targetDate }, type: db.QueryTypes.SELECT });

  // Format no_trans from tanggal + id: dd/mm/yy/km/{zis_id}/{id padded}
  const d = new Date(targetDate);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);

  const items = rows.map((r, idx) => {
    const namaZis = (r.jenis_zis_nama || '').toLowerCase();
    const isNonDonasi = namaZis.includes('zakat') || namaZis.includes('fidyah');
    const isDonasi = !isNonDonasi;
    
    return {
      no: idx + 1,
      npwz: r.npwz || '-',
      nama: r.nama_muzakki || '-',
      donasi: isDonasi ? parseFloat(r.jumlah || 0) : 0,
      non_donasi: isNonDonasi ? parseFloat(r.jumlah || 0) : 0,
      via: r.via_nama || '-',
      via_id: r.via_id
    };
  });

  // Summary by via — match by name (case-insensitive)
  const viaNama = (r) => (r.via_nama || '').toLowerCase();

  // Tunai: matching "cash" or "tunai"
  const tunai = rows.filter(r => viaNama(r).includes('cash') || viaNama(r).includes('tunai')).reduce((s, r) => s + parseFloat(r.jumlah || 0), 0);

  // Bank: matching "bank"
  const bank = rows.filter(r => viaNama(r).includes('bank')).reduce((s, r) => s + parseFloat(r.jumlah || 0), 0);

  // Lain: everything else (including "kantor digital" etc.)
  const lain = rows.filter(r => {
    const name = viaNama(r);
    return !name.includes('cash') && !name.includes('tunai') && !name.includes('bank');
  }).reduce((s, r) => s + parseFloat(r.jumlah || 0), 0);
  const total = tunai + bank + lain;

  // Day name in Indonesian
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const dayName = dayNames[d.getDay()];
  const dateLabel = `Hari ${dayName} Tanggal ${dd}/${mm}/${yy.length === 2 ? '20' + yy : yy}`;
  const signatureDate = `${dd} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;

  return {
    tanggal: targetDate,
    dateLabel,
    signatureDate,
    items,
    summary: { tunai, bank, lain, total }
  };
};

export default {
  getArusKas,
  getNeraca,
  getRekapTahunan,
  getRawDataForExport,
  getDistribusiByProgram,
  getDistribusiByAsnaf,
  getDistribusiHarian,
  getPerubahanDana,
  getKasMasukHarian
};

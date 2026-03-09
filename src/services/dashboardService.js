import Penerimaan from '../models/penerimaanModel.js';
import Distribusi from '../models/distribusiModel.js';
import { Op } from 'sequelize';
import db from '../config/database.js';

const getDashboardInfo = async (query) => {
  const now = new Date();
  const tahun = parseInt(query.tahun) || now.getFullYear();
  const bulan = query.bulan || null;

  // Use raw connection to bypass Sequelize's automatic result flattening for stored procedures
  const connection = await db.connectionManager.getConnection();

  try {
    const promiseConn = connection.promise();

    // 1. Get Overview Stats
    const [resultsOverview] = await promiseConn.query(
      'CALL sp_dashboard_overview_by_year(?)',
      [tahun]
    );
    // resultsOverview[0] is the first result set, resultsOverview[0][0] is the row
    const overview = (resultsOverview && resultsOverview[0] && resultsOverview[0][0]) || {};

    // 2. Get Detailed Receipt Stats
    const [resultsDetail] = await promiseConn.query(
      'CALL sp_receipt_stats_by_month_year(?, ?)',
      [bulan || 'all', tahun]
    );

    // resultsDetail is an array of result sets (rs0 to rs5) + OkPacket (rs6)
    const statsDetail = Array.isArray(resultsDetail) ? resultsDetail : [];

    // Helper to format result sets (ensure total is a number)
    const mapStats = (rs) => {
      if (!Array.isArray(rs)) return [];
      return rs.map(row => ({
        ...row,
        total: parseFloat(row.total) || 0
      }));
    };

    const finalOverview = {
      total_muzakki: parseInt(overview.total_muzakki) || 0,
      total_mustahiq: parseInt(overview.total_mustahiq) || 0,
      total_penerimaan: parseFloat(overview.total_penerimaan) || 0,
      total_distribusi: parseFloat(overview.total_distribusi) || 0,
      total_distribusi_menunggu: parseInt(overview.total_distribusi_menunggu) || 0
    };

    // If we have a month filter, use the filtered total from sp_receipt_stats_by_month_year
    // The 6th result set (index 5) contains { filtered_total }
    if (bulan && bulan !== 'all' && statsDetail[5] && statsDetail[5][0]) {
      finalOverview.total_penerimaan = parseFloat(statsDetail[5][0].filtered_total) || 0;
    }

    // 7th result set (index 6) contains { total_dana_bersih, total_dana_amil }
    const amil_summary = (statsDetail[6] && statsDetail[6][0]) ? {
      total_dana_bersih: parseFloat(statsDetail[6][0].total_dana_bersih) || 0,
      total_dana_amil: parseFloat(statsDetail[6][0].total_dana_amil) || 0,
    } : { total_dana_bersih: 0, total_dana_amil: 0 };

    return {
      overview: finalOverview,
      details: {
        by_jenis_muzakki: mapStats(statsDetail[0]),
        by_jenis_zakat: mapStats(statsDetail[1]),
        by_jenis_infak: mapStats(statsDetail[2]),
        by_via: mapStats(statsDetail[3]),
        by_jenis_upz: mapStats(statsDetail[4]),
        ...amil_summary
      },
      tahun,
      bulan
    };
  } finally {
    // CRITICAL: Always release the connection back to the pool
    await db.connectionManager.releaseConnection(connection);
  }
};

export default {
  getDashboardInfo
};

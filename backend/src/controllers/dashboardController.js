import { Donation } from '../models/Donation.js';
import { Delivery } from '../models/Delivery.js';
import { User } from '../models/User.js';
import { FoodRequest } from '../models/FoodRequest.js';

export async function getImpactMetrics(_req, res, next) {
  try {
    // Count only delivered quantities in their original units; do not turn meals into weight.
    const deliveredTotals = await Donation.aggregate([
      { $match: { status: 'DELIVERED' } },
      { $group: { _id: '$unit', quantity: { $sum: '$quantity' } } }
    ]);
    const quantityByUnit = Object.fromEntries(deliveredTotals.map(({ _id, quantity }) => [_id, quantity]));
    const totalMealsRescued = quantityByUnit.meals || 0;
    const totalFoodDivertedLbs = quantityByUnit.lbs || 0;
    const totalFoodDivertedKg = quantityByUnit.kg || 0;
    // No CO2e factor is asserted without measured weights and a cited methodology.
    const co2eAvoidedKg = null;

    // Count registered shelters, completed deliveries, active drivers, and pending community requests
    const [sheltersCount, completedDeliveriesCount, activeVolunteersCount, pendingRequestsCount] =
      await Promise.all([
        User.countDocuments({ role: 'SHELTER' }),
        Delivery.countDocuments({ status: 'DELIVERED' }),
        User.countDocuments({ role: 'DRIVER' }),
        FoodRequest.countDocuments({ status: 'PENDING' })
      ]);

    const categoryAgg = await Donation.aggregate([
      { $match: { status: 'DELIVERED', unit: 'lbs' } },
      { $group: { _id: '$foodType', lbs: { $sum: '$quantity' } } }
    ]);
    const totalCategoryLbs = categoryAgg.reduce((acc, c) => acc + c.lbs, 0);
    const categoryColors = {
      'Prepared Meals': '#16a34a',
      'Bakery': '#059669',
      'Fruits & Vegetables': '#0d9488',
      'Packaged Food': '#2563eb',
      'Dairy': '#7c3aed',
      'Other': '#64748b'
    };

    const categoryDistribution = categoryAgg.map(c => ({
      name: c._id || 'General Surplus',
      lbs: Math.round(c.lbs),
      percentage: totalCategoryLbs ? Math.round((c.lbs / totalCategoryLbs) * 100) : 0,
      color: categoryColors[c._id] || '#64748b'
    }));

    // Group actual delivered meal donations by month; no projected history.
    const monthlyAgg = await Donation.aggregate([
      { $match: { status: 'DELIVERED', unit: 'meals' } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$updatedAt' } },
        meals: { $sum: '$quantity' }
      } },
      { $sort: { _id: 1 } },
      { $limit: 12 }
    ]);
    const activityTimeline = monthlyAgg.map(row => ({ month: row._id, meals: row.meals }));

    // 5. Recent completed deliveries
    const recentDeliveries = await Delivery.find({ status: 'DELIVERED' })
      .sort({ updatedAt: -1 })
      .limit(6)
      .lean();

    const recentRescues = recentDeliveries.map(d => ({
      id: d._id.toString(),
      food: `${d.quantity} ${d.food}`,
      donor: d.pickup,
      recipient: d.destination,
      timestamp: d.deliveredAt ? new Date(d.deliveredAt).toLocaleDateString() : ''
    }));

    // 6. Network Nodes for the City-Wide Map (Real DB coordinates)
    const [donors, shelters, requests] = await Promise.all([
      User.find({ role: 'DONOR', 'location.coordinates': { $exists: true } })
        .select('name organizationName address location')
        .lean(),
      User.find({ role: 'SHELTER', 'location.coordinates': { $exists: true } })
        .select('name organizationName address location capacity')
        .lean(),
      FoodRequest.find({ status: { $in: ['PENDING', 'APPROVED'] } })
        .select('recipientName deliveryAddress location foodCategory quantityNeeded unit urgency status')
        .limit(20)
        .lean()
    ]);

    const networkMarkers = [
      ...donors.map(d => ({
        id: `donor-${d._id}`,
        title: d.organizationName || d.name,
        type: 'donation',
        address: d.address || '',
        coordinates: d.location?.coordinates,
        badge: 'Food Donor Hub'
      })),
      ...shelters.map(s => ({
        id: `shelter-${s._id}`,
        title: s.organizationName || s.name,
        type: 'shelter',
        address: s.address || '',
        coordinates: s.location?.coordinates,
        badge: `Capacity: ${s.capacity?.current || 0}/${s.capacity?.max ?? 0}`
      })),
      ...requests.map(r => ({
        id: `request-${r._id}`,
        title: `Need: ${r.quantityNeeded} ${r.unit} ${r.foodCategory}`,
        type: 'request',
        address: r.deliveryAddress || '',
        coordinates: r.location?.coordinates,
        badge: `${r.urgency} Urgency - ${r.recipientName}`
      }))
    ];

    res.status(200).json({
      success: true,
      data: {
        metrics: {
          totalMealsRescued,
          totalFoodDivertedLbs,
          totalFoodDivertedKg,
          quantityByUnit,
          co2eAvoidedKg,
          organizationsHelped: sheltersCount,
          completedDeliveries: completedDeliveriesCount,
          activeVolunteers: activeVolunteersCount,
          pendingRequests: pendingRequestsCount
        },
        categoryDistribution,
        activityTimeline,
        recentRescues,
        networkMarkers
      }
    });
  } catch (error) {
    next(error);
  }
}

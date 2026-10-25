const prisma = require('../lib/prisma');
const asyncHandler = require('../utils/asyncHandler');

const getInstitutions = asyncHandler(async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const institutions = await prisma.institution.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { city: { contains: q, mode: 'insensitive' } },
            { country: { contains: q, mode: 'insensitive' } },
          ],
        }
      : undefined,
    orderBy: { name: 'asc' },
    take: 200,
  });
  res.json({ success: true, institutions: institutions.map((row) => ({ ...row, _id: row.id })) });
});

module.exports = { getInstitutions };

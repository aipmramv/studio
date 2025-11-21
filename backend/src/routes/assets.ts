import { Router, Request, Response } from 'express';
import { getDatabase } from '../lib/database.js';
import { sendSuccess, sendError, sendPaginated } from '../lib/response.js';
import { NotFoundError, ValidationError } from '../lib/errors.js';
import { ObjectId } from 'mongodb';

const router = Router();

// GET /api/assets
router.get('/', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const assetsCollection = db.collection('assets');

    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const skip = (page - 1) * pageSize;

    const total = await assetsCollection.countDocuments();
    const items = await assetsCollection
      .find()
      .skip(skip)
      .limit(pageSize)
      .toArray();

    return sendPaginated(res, items, total, page, pageSize);
  } catch (error: any) {
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to fetch assets');
  }
});

// GET /api/assets/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const assetsCollection = db.collection('assets');

    const asset = await assetsCollection.findOne({
      _id: new ObjectId(req.params.id),
    });

    if (!asset) {
      throw new NotFoundError('Asset not found');
    }

    return sendSuccess(res, asset);
  } catch (error: any) {
    if (error.statusCode && error.code) {
      return sendError(res, error.statusCode, error.code, error.message);
    }
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to fetch asset');
  }
});

// POST /api/assets
router.post('/', async (req: Request, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return sendError(res, 403, 'FORBIDDEN', 'Only admins can create assets');
    }

    const db = getDatabase();
    const assetsCollection = db.collection('assets');

    const {
      assetNumber,
      assetDescription,
      department,
      location,
      currentStatus,
      purchaseValue,
      purchaseDate,
    } = req.body;

    if (!assetNumber || !assetDescription) {
      throw new ValidationError('Asset number and description are required');
    }

    const result = await assetsCollection.insertOne({
      assetNumber,
      assetDescription,
      department,
      location,
      currentStatus: currentStatus || 'Active',
      purchaseValue,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const newAsset = await assetsCollection.findOne({ _id: result.insertedId });
    return sendSuccess(res, newAsset, 201);
  } catch (error: any) {
    if (error.statusCode && error.code) {
      return sendError(res, error.statusCode, error.code, error.message);
    }
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to create asset');
  }
});

// PUT /api/assets/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return sendError(res, 403, 'FORBIDDEN', 'Only admins can update assets');
    }

    const db = getDatabase();
    const assetsCollection = db.collection('assets');

    const result = await assetsCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      {
        $set: {
          ...req.body,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      throw new NotFoundError('Asset not found');
    }

    const updatedAsset = await assetsCollection.findOne({
      _id: new ObjectId(req.params.id),
    });

    return sendSuccess(res, updatedAsset);
  } catch (error: any) {
    if (error.statusCode && error.code) {
      return sendError(res, error.statusCode, error.code, error.message);
    }
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to update asset');
  }
});

// DELETE /api/assets/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return sendError(res, 403, 'FORBIDDEN', 'Only admins can delete assets');
    }

    const db = getDatabase();
    const assetsCollection = db.collection('assets');

    const result = await assetsCollection.deleteOne({
      _id: new ObjectId(req.params.id),
    });

    if (result.deletedCount === 0) {
      throw new NotFoundError('Asset not found');
    }

    return sendSuccess(res, { message: 'Asset deleted successfully' });
  } catch (error: any) {
    if (error.statusCode && error.code) {
      return sendError(res, error.statusCode, error.code, error.message);
    }
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to delete asset');
  }
});

export default router;

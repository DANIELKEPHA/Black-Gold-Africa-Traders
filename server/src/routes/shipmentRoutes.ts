import express, { Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {
    createShipment,
    getShipments,
    updateShipment,
    getShipmentHistory,
    updateShipmentStatus,
    removeShipment,
} from '../controllers/shipmentController';
import { asyncHandler } from '../utils/asyncHandler';

const router = express.Router();

/**
 * @route GET /admin/shipments
 * @desc Retrieve all shipments (admin only)
 * @access Authenticated (Admin only)
 */
router.get(
    '/admin/shipments',
    authMiddleware(['admin']),
    asyncHandler(getShipments),
);

/**
 * @route GET /users/:userCognitoId/shipments
 * @desc Retrieve shipments for a user
 * @access Authenticated (Admin or Self)
 */
router.get(
    '/users/:userCognitoId/shipments',
    authMiddleware(['admin', 'user']),
    asyncHandler(getShipments),
);

/**
 * @route POST /users/:userCognitoId/shipments
 * @desc Create a new shipment for a user
 * @access Authenticated (User only)
 */
router.post(
    '/users/:userCognitoId/shipments',
    authMiddleware(['user']),
    asyncHandler(createShipment),
);

/**
 * @route PATCH /users/:userCognitoId/shipments/:id
 * @desc Update an existing shipment
 * @access Authenticated (User only)
 */
router.patch(
    '/users/:userCognitoId/shipments/:id',
    authMiddleware(['user']),
    asyncHandler(updateShipment),
);

/**
 * @route DELETE /users/:userCognitoId/shipments/:id
 * @desc Delete an existing shipment
 * @access Authenticated (Admin or Self)
 */
router.delete(
    '/users/:userCognitoId/shipments/:id',
    authMiddleware(['admin', 'user']),
    asyncHandler(removeShipment),
);

/**
 * @route PUT /admin/shipments/:id/status
 * @desc Update shipment status (admin only)
 * @access Authenticated (Admin only)
 */
router.put(
    '/admin/shipments/:id/status',
    authMiddleware(['admin']),
    asyncHandler(updateShipmentStatus),
);

/**
 * @route GET /users/:userCognitoId/shipment-history
 * @desc Retrieve shipment history for a user
 * @access Authenticated (Admin or Self)
 */
router.get(
    '/users/:userCognitoId/shipment-history',
    authMiddleware(['admin', 'user']),
    asyncHandler(getShipmentHistory),
);

export default router;
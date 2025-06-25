"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const shipmentController_1 = require("../controllers/shipmentController");
const asyncHandler_1 = require("../utils/asyncHandler");
const router = express_1.default.Router();
/**
 * @route GET /admin/shipments
 * @desc Retrieve all shipments (admin only)
 * @access Authenticated (Admin only)
 */
router.get('/admin/shipments', (0, authMiddleware_1.authMiddleware)(['admin']), (0, asyncHandler_1.asyncHandler)(shipmentController_1.getShipments));
/**
 * @route GET /users/:userCognitoId/shipments
 * @desc Retrieve shipments for a user
 * @access Authenticated (Admin or Self)
 */
router.get('/users/:userCognitoId/shipments', (0, authMiddleware_1.authMiddleware)(['admin', 'user']), (0, asyncHandler_1.asyncHandler)(shipmentController_1.getShipments));
/**
 * @route POST /users/:userCognitoId/shipments
 * @desc Create a new shipment for a user
 * @access Authenticated (User only)
 */
router.post('/users/:userCognitoId/shipments', (0, authMiddleware_1.authMiddleware)(['user']), (0, asyncHandler_1.asyncHandler)(shipmentController_1.createShipment));
/**
 * @route PATCH /users/:userCognitoId/shipments/:id
 * @desc Update an existing shipment
 * @access Authenticated (User only)
 */
router.patch('/users/:userCognitoId/shipments/:id', (0, authMiddleware_1.authMiddleware)(['user']), (0, asyncHandler_1.asyncHandler)(shipmentController_1.updateShipment));
/**
 * @route DELETE /users/:userCognitoId/shipments/:id
 * @desc Delete an existing shipment
 * @access Authenticated (Admin or Self)
 */
router.delete('/users/:userCognitoId/shipments/:id', (0, authMiddleware_1.authMiddleware)(['admin', 'user']), (0, asyncHandler_1.asyncHandler)(shipmentController_1.removeShipment));
/**
 * @route PUT /admin/shipments/:id/status
 * @desc Update shipment status (admin only)
 * @access Authenticated (Admin only)
 */
router.put('/admin/shipments/:id/status', (0, authMiddleware_1.authMiddleware)(['admin']), (0, asyncHandler_1.asyncHandler)(shipmentController_1.updateShipmentStatus));
/**
 * @route GET /users/:userCognitoId/shipment-history
 * @desc Retrieve shipment history for a user
 * @access Authenticated (Admin or Self)
 */
router.get('/users/:userCognitoId/shipment-history', (0, authMiddleware_1.authMiddleware)(['admin', 'user']), (0, asyncHandler_1.asyncHandler)(shipmentController_1.getShipmentHistory));
exports.default = router;

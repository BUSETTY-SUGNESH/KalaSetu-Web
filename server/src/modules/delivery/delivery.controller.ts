import { Response } from 'express';
import { DeliveryStatus } from '@prisma/client';
import { AuthRequest } from '../../middleware/auth.middleware';
import { sendSuccess, sendError, getErrorMessage } from '../../utils/http';
import { logError } from '../../utils/logger';
import * as deliveryService from './delivery.service';

const validStatuses: DeliveryStatus[] = ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'FAILED'];

export const assignDelivery = async (req: AuthRequest, res: Response) => {
  try {
    const { orderId, deliveryUserId } = req.body;
    if (!orderId || !deliveryUserId) {
      return sendError(res, 400, 'orderId and deliveryUserId required');
    }

    const assignment = await deliveryService.assignDelivery(orderId, deliveryUserId);
    return sendSuccess(res, assignment, 'Delivery assigned', 201);
  } catch (error) {
    logError('delivery.assign', error);
    const message = getErrorMessage(error, 'Failed to assign delivery');
    return sendError(res, 400, message, error);
  }
};

export const updateStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!validStatuses.includes(status)) {
      return sendError(res, 400, `Invalid status. Valid: ${validStatuses.join(', ')}`);
    }

    const updated = await deliveryService.updateStatus(
      id,
      req.user!.userId,
      status as DeliveryStatus,
      notes,
    );
    return sendSuccess(res, updated, 'Delivery status updated');
  } catch (error) {
    logError('delivery.updateStatus', error);
    const message = getErrorMessage(error, 'Failed to update delivery');
    return sendError(res, 400, message, error);
  }
};

export const getMyDeliveries = async (req: AuthRequest, res: Response) => {
  try {
    const status = req.query.status as DeliveryStatus | undefined;
    const deliveries = await deliveryService.getMyDeliveries(req.user!.userId, status);
    return sendSuccess(res, deliveries);
  } catch (error) {
    logError('delivery.getMyDeliveries', error);
    return sendError(res, 500, 'Failed to fetch deliveries', error);
  }
};

export const getDeliveryByOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { orderId } = req.params;
    const delivery = await deliveryService.getDeliveryByOrder(orderId);
    return sendSuccess(res, delivery);
  } catch (error) {
    logError('delivery.getByOrder', error);
    return sendError(res, 500, 'Failed to fetch delivery info', error);
  }
};

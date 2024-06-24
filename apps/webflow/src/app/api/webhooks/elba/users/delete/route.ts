import { NextResponse } from 'next/server';
import { parseWebhookEventData } from '@elba-security/sdk';
import { deleteUserRequest } from './service';

export async function DELETE(request: Request) {
  const data: unknown = await request.json();

  const {ids: userIds, organisationId} = parseWebhookEventData('users.delete_users_requested', data);

  await deleteUserRequest({
    userIds,
    organisationId
  });

  return new NextResponse();
}
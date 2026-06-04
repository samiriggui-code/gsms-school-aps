import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { id } = await params;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        Session: true,
        accounts: true,
      },
    });

    if (!user) return fail('Conformité non trouvée', 404);

    return ok(user);
  } catch (error) {
    return fail('Impossible de récupérer la conformité.', 500, error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { id } = await params;

  try {
    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      roleId,
      userCategory,
      subcontractorId,
      jobFunction,
      qualification,
      status,
      birthDate,
      birthPlace,
      nationality,
      socialSecurityNumber,
      cniNumber,
      residencePermitNumber,
      residencePermitExpiry,
      carteProNumber,
      carteProExpiry,
      isSchedulable,
      contractType,
      workTimeType,
      contractStartDate,
      contractEndDate,
      address,
      city,
      postalCode,
      avatarFile,
      avatarAction,
      documentCni,
      documentAssurance,
      documentResidencePermit,
      documentCartePro,
    } = body;

    const updateData: any = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (roleId !== undefined) updateData.roleId = roleId;
    if (userCategory !== undefined) updateData.userCategory = userCategory;
    if (subcontractorId !== undefined) updateData.subcontractorId = subcontractorId;
    if (jobFunction !== undefined) updateData.jobFunction = jobFunction;
    if (qualification !== undefined) updateData.qualification = qualification;
    if (status !== undefined) updateData.status = status;
    if (birthDate !== undefined) updateData.birthDate = birthDate ? new Date(birthDate) : null;
    if (birthPlace !== undefined) updateData.birthPlace = birthPlace;
    if (nationality !== undefined) updateData.nationality = nationality;
    if (socialSecurityNumber !== undefined) updateData.socialSecurityNumber = socialSecurityNumber;
    if (cniNumber !== undefined) updateData.cniNumber = cniNumber;
    if (residencePermitNumber !== undefined) updateData.residencePermitNumber = residencePermitNumber;
    if (residencePermitExpiry !== undefined) updateData.residencePermitExpiry = residencePermitExpiry ? new Date(residencePermitExpiry) : null;
    if (carteProNumber !== undefined) updateData.carteProNumber = carteProNumber;
    if (carteProExpiry !== undefined) updateData.carteProExpiry = carteProExpiry ? new Date(carteProExpiry) : null;
    if (isSchedulable !== undefined) updateData.isSchedulable = isSchedulable;
    if (contractType !== undefined) updateData.contractType = contractType;
    if (workTimeType !== undefined) updateData.workTimeType = workTimeType;
    if (contractStartDate !== undefined) updateData.contractStartDate = contractStartDate ? new Date(contractStartDate) : null;
    if (contractEndDate !== undefined) updateData.contractEndDate = contractEndDate ? new Date(contractEndDate) : null;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (postalCode !== undefined) updateData.postalCode = postalCode;
    // Avatar/document file handling would go here

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      include: { role: true },
    });

    return ok(updatedUser);
  } catch (error) {
    return fail('Impossible de mettre à jour la conformité.', 500, error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { id } = await params;

  try {
    await prisma.user.delete({
      where: { id },
    });

    return ok({ message: 'Conformité supprimée avec succès' });
  } catch (error) {
    return fail('Impossible de supprimer la conformité.', 500, error);
  }
}

// Restoration endpoint (POST /:id) - used to reactivate a deactivated account
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { id } = await params;

  try {
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { status: 'ACTIVE', isTrashed: false },
      include: { role: true },
    });

    return ok(updatedUser);
  } catch (error) {
    return fail('Impossible de réintégrer le conformité.', 500, error);
  }
}

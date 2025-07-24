import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { Decimal } from "@prisma/client/runtime/library";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const location = searchParams.get("location");
    const expiring = searchParams.get("expiring");
    const lowStock = searchParams.get("lowStock");

    const where: any = {
      userId: session.user.id,
    };

    if (location && location !== "all") {
      where.location = location;
    }

    if (expiring === "true") {
      const weekFromNow = new Date();
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      where.expiryDate = {
        lte: weekFromNow,
        gte: new Date(),
      };
    }

    const pantryItems = await prisma.pantryItem.findMany({
      where,
      include: {
        ingredient: true,
        extended: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    let filteredItems = pantryItems;

    if (lowStock === "true") {
      filteredItems = pantryItems.filter(item => item.quantity <= 1);
    }

    return NextResponse.json(filteredItems);
  } catch (error: unknown) {
    console.error("Error fetching pantry items:", error);
    return NextResponse.json(
      { error: "Failed to fetch pantry items" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const {
      ingredientName,
      quantity,
      unit,
      location,
      expiryDate,
      notes,
      purchasePrice,
      purchaseDate,
      barcode,
    } = data;

    // First, create or find the ingredient
    const ingredient = await prisma.ingredient.upsert({
      where: { name: ingredientName.toLowerCase() },
      update: {},
      create: {
        name: ingredientName.toLowerCase(),
        unit: unit || "un",
      },
    });

    // Check if user already has this ingredient in pantry
    const existingItem = await prisma.pantryItem.findUnique({
      where: {
        userId_ingredientId: {
          userId: session.user.id,
          ingredientId: ingredient.id,
        },
      },
    });

    if (existingItem) {
      // Update existing item by adding quantities
      const updatedItem = await prisma.pantryItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + quantity,
          location: location || existingItem.location,
          expiryDate: expiryDate ? new Date(expiryDate) : existingItem.expiryDate,
          notes: notes || existingItem.notes,
          updatedAt: new Date(),
        },
        include: {
          ingredient: true,
          extended: {
            include: {
              product: true,
            },
          },
        },
      });

      // Update extended info if provided
      if (purchasePrice || purchaseDate || barcode) {
        await prisma.pantryItemExtended.upsert({
          where: { pantryItemId: updatedItem.id },
          update: {
            purchasePrice: purchasePrice ? new Decimal(purchasePrice) : undefined,
            purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
            scannedBarcode: barcode || undefined,
          },
          create: {
            pantryItemId: updatedItem.id,
            purchasePrice: purchasePrice ? new Decimal(purchasePrice) : null,
            purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
            scannedBarcode: barcode || null,
          },
        });
      }

      return NextResponse.json(updatedItem, { status: 200 });
    } else {
      // Create new pantry item
      const newItem = await prisma.pantryItem.create({
        data: {
          userId: session.user.id,
          ingredientId: ingredient.id,
          quantity,
          unit: unit || "un",
          location: location || "pantry",
          expiryDate: expiryDate ? new Date(expiryDate) : null,
          notes: notes || null,
          purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
        },
        include: {
          ingredient: true,
          extended: {
            include: {
              product: true,
            },
          },
        },
      });

      // Create extended info if provided
      if (purchasePrice || purchaseDate || barcode) {
        await prisma.pantryItemExtended.create({
          data: {
            pantryItemId: newItem.id,
            purchasePrice: purchasePrice ? new Decimal(purchasePrice) : null,
            purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
            scannedBarcode: barcode || null,
          },
        });
      }

      return NextResponse.json(newItem, { status: 201 });
    }
  } catch (error: unknown) {
    console.error("Error creating pantry item:", error);
    return NextResponse.json(
      { error: "Failed to create pantry item" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Item ID is required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const item = await prisma.pantryItem.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!item || item.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Item not found or unauthorized" },
        { status: 404 }
      );
    }

    // Delete the item (cascade will handle extended info)
    await prisma.pantryItem.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error deleting pantry item:", error);
    return NextResponse.json(
      { error: "Failed to delete pantry item" },
      { status: 500 }
    );
  }
}
import { NextResponse } from "next/server";
import { getUser } from '@/lib/auth/supabase-auth';
import { Decimal } from "@prisma/client/runtime/library";
import { logger } from '@/lib/logger';
import { db } from '@/lib/supabase/database.service';

export async function GET(req: Request) {
  try {
    const user = await getUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const location = searchParams.get("location");
    const expiring = searchParams.get("expiring");
    const lowStock = searchParams.get("lowStock");

    const where: any = {
      userId: user.id,
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

    const pantryItems = await db.getPantryItems(user.id, {
      where,
      // includes handled by Supabase service,
        },
      orderBy: {
        createdAt: "desc",
      });

    let filteredItems = pantryItems;

    if (lowStock === "true") {
      filteredItems = pantryItems.filter(item => item.quantity <= 1);
    }

    return NextResponse.json(filteredItems);
  } catch (error: unknown) {
    logger.error("Error fetching pantry items:", 'API:route', error);
    return NextResponse.json(
      { error: "Failed to fetch pantry items" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUser();
    if (!user?.id) {
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
      });

    // Check if user already has this ingredient in pantry
    const existingItem = await prisma.pantryItem.findUnique({
      where: {
        userId_ingredientId: {
          userId: user.id,
          ingredientId: ingredient.id,
        }
      });

    if (existingItem) {
      // Update existing item by adding quantities
      const updatedItem = await db.updatePantryItem(existingItem.id, {
        quantity: existingItem.quantity + quantity,
          location: location || existingItem.location,
          expiryDate: expiryDate ? new Date(expiryDate) : existingItem.expiryDate,
          notes: notes || existingItem.notes,
          updatedAt: new Date(),
        },
        // includes handled by Supabase service,
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
          });
      }

      return NextResponse.json(updatedItem, { status: 200 });
    } else {
      // Create new pantry item
      const newItem = await db.addPantryItem(user.id, {
          ingredientId: ingredient.id,
          quantity,
          unit: unit || "un",
          location: location || "pantry",
          expiryDate: expiryDate ? new Date(expiryDate) : null,
          notes: notes || null,
          purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
        },
        // includes handled by Supabase service,
          });

      // Create extended info if provided
      if (purchasePrice || purchaseDate || barcode) {
        await prisma.pantryItemExtended.create({ pantryItemId: newItem.id,
            purchasePrice: purchasePrice ? new Decimal(purchasePrice) : null,
            purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
            scannedBarcode: barcode || null,
          });
      }

      return NextResponse.json(newItem, { status: 201 });
    }
  } catch (error: unknown) {
    logger.error("Error creating pantry item:", 'API:route', error);
    return NextResponse.json(
      { error: "Failed to create pantry item" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getUser();
    if (!user?.id) {
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
      select: { userId: true }
    });

    if (!item || item.userId !== user.id) {
      return NextResponse.json(
        { error: "Item not found or unauthorized" },
        { status: 404 }
      );
    }

    // Delete the item (cascade will handle extended info)
    await db.deletePantryItem(id, user.id);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    logger.error("Error deleting pantry item:", 'API:route', error);
    return NextResponse.json(
      { error: "Failed to delete pantry item" },
      { status: 500 }
    );
  }
}
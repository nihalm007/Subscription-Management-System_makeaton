const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

// GET /api/products - list all products with variants
router.get('/', authenticate, (req, res) => {
  const products = db.prepare(`
    SELECT * FROM products WHERE active = 1 ORDER BY id DESC
  `).all();

  const getVariants = db.prepare(`
    SELECT * FROM product_variants WHERE product_id = ? ORDER BY id ASC
  `);

  const enriched = products.map(product => {
    const variants = getVariants.all(product.id);
    return {
      ...product,
      variants
    };
  });

  res.json({ products: enriched });
});

// GET /api/products/:id - single product
router.get('/:id', authenticate, (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found.' });
  }
  const variants = db.prepare('SELECT * FROM product_variants WHERE product_id = ?').all(product.id);
  res.json({ product: { ...product, variants } });
});

// POST /api/products - Admin only: create product with variants
router.post('/', authenticate, requireAdmin, (req, res) => {
  const { name, type, sales_price, cost_price, notes, variants } = req.body;

  if (!name || !type || sales_price === undefined) {
    return res.status(400).json({ error: 'Name, type, and sales_price are required.' });
  }

  const validTypes = ['Software', 'Add-on', 'Service', 'Physical'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: `Type must be one of: ${validTypes.join(', ')}` });
  }

  const insertProduct = db.prepare(`
    INSERT INTO products (name, type, sales_price, cost_price, notes)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertVariant = db.prepare(`
    INSERT INTO product_variants (product_id, variant_name, attribute_type, price_extra, sku)
    VALUES (?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction(() => {
    const info = insertProduct.run(
      name.trim(),
      type,
      Number(sales_price),
      Number(cost_price || 0),
      notes || null
    );
    const productId = info.lastInsertRowid;

    if (Array.isArray(variants) && variants.length > 0) {
      for (const v of variants) {
        if (v.variant_name && v.variant_name.trim()) {
          insertVariant.run(
            productId,
            v.variant_name.trim(),
            v.attribute_type || 'brand',
            Number(v.price_extra || 0),
            v.sku || null
          );
        }
      }
    }

    return productId;
  });

  try {
    const productId = transaction();
    const createdProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
    const createdVariants = db.prepare('SELECT * FROM product_variants WHERE product_id = ?').all(productId);
    res.status(201).json({
      message: 'Product created successfully',
      product: { ...createdProduct, variants: createdVariants }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create product: ' + err.message });
  }
});

// PUT /api/products/:id - Admin only: update product & variants
router.put('/:id', authenticate, requireAdmin, (req, res) => {
  const { name, type, sales_price, cost_price, notes, variants } = req.body;
  const productId = req.params.id;

  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
  if (!existing) {
    return res.status(404).json({ error: 'Product not found.' });
  }

  const transaction = db.transaction(() => {
    db.prepare(`
      UPDATE products
      SET name = ?, type = ?, sales_price = ?, cost_price = ?, notes = ?
      WHERE id = ?
    `).run(
      name || existing.name,
      type || existing.type,
      sales_price !== undefined ? Number(sales_price) : existing.sales_price,
      cost_price !== undefined ? Number(cost_price) : existing.cost_price,
      notes !== undefined ? notes : existing.notes,
      productId
    );

    if (Array.isArray(variants)) {
      db.prepare('DELETE FROM product_variants WHERE product_id = ?').run(productId);
      const insertVariant = db.prepare(`
        INSERT INTO product_variants (product_id, variant_name, attribute_type, price_extra, sku)
        VALUES (?, ?, ?, ?, ?)
      `);
      for (const v of variants) {
        if (v.variant_name && v.variant_name.trim()) {
          insertVariant.run(
            productId,
            v.variant_name.trim(),
            v.attribute_type || 'brand',
            Number(v.price_extra || 0),
            v.sku || null
          );
        }
      }
    }
  });

  try {
    transaction();
    const updatedProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
    const updatedVariants = db.prepare('SELECT * FROM product_variants WHERE product_id = ?').all(productId);
    res.json({
      message: 'Product updated successfully',
      product: { ...updatedProduct, variants: updatedVariants }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update product: ' + err.message });
  }
});

// DELETE /api/products/:id - Admin only (soft delete)
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  db.prepare('UPDATE products SET active = 0 WHERE id = ?').run(req.params.id);
  res.json({ message: 'Product deactivated successfully' });
});

module.exports = router;


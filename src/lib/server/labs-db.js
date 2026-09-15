// Query functions for the labs/lab_steps tables (see migrations/0001_labs.sql).
// Additive-only, plain parameterized D1 queries - no query builder, matching
// every other Iterverse service's db.js convention.

function parseJsonArray(value) {
	try {
		const parsed = JSON.parse(value);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

function rowToLab(row) {
	return {
		id: row.id,
		name: row.name,
		icon: row.icon,
		subtitle: row.subtitle,
		description: row.description,
		tags: parseJsonArray(row.tags),
		tools: parseJsonArray(row.tools),
		difficulty: parseJsonArray(row.difficulty),
		active: !!row.active,
		position: row.position,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
		// Only present when the row came from listLabs' step-count subquery
		// below - getLab/listActiveLabsWithSteps attach the real `steps`
		// array instead, which callers should prefer when it's there.
		...(row.step_count != null && { stepCount: row.step_count })
	};
}

function rowToStep(row) {
	return {
		id: row.id,
		labId: row.lab_id,
		position: row.position,
		name: row.name,
		subtitle: row.subtitle,
		header: !!row.header,
		content: row.content
	};
}

export async function listLabs(db, { includeInactive = true } = {}) {
	const where = includeInactive ? "" : "WHERE active = 1";
	const { results } = await db
		.prepare(
			`SELECT labs.*, (SELECT COUNT(*) FROM lab_steps WHERE lab_steps.lab_id = labs.id) AS step_count
			 FROM labs ${where} ORDER BY position ASC, name ASC`
		)
		.all();
	return results.map(rowToLab);
}

export async function listStepsByLabId(db, labId) {
	const { results } = await db
		.prepare("SELECT * FROM lab_steps WHERE lab_id = ? ORDER BY position ASC")
		.bind(labId)
		.all();
	return results.map(rowToStep);
}

export async function getLab(db, id) {
	const row = await db.prepare("SELECT * FROM labs WHERE id = ?").bind(id).first();
	if (!row) return null;
	const steps = await listStepsByLabId(db, id);
	return { ...rowToLab(row), steps };
}

// Active labs with their steps, shaped for the public /api/labs endpoint -
// one query per lab is fine at this scale (same reasoning ad_labs' own
// docs give for its sessions endpoint: this is a small dataset, not
// something that needs a join).
export async function listActiveLabsWithSteps(db) {
	const labs = await listLabs(db, { includeInactive: false });
	const withSteps = await Promise.all(
		labs.map(async (lab) => ({ ...lab, steps: await listStepsByLabId(db, lab.id) }))
	);
	return withSteps;
}

export async function createLab(db, lab) {
	await db
		.prepare(
			`INSERT INTO labs (id, name, icon, subtitle, description, tags, tools, difficulty, position)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
		)
		.bind(
			lab.id,
			lab.name,
			lab.icon,
			lab.subtitle,
			lab.description,
			JSON.stringify(lab.tags),
			JSON.stringify(lab.tools),
			JSON.stringify(lab.difficulty),
			lab.position
		)
		.run();
	return getLab(db, lab.id);
}

const LAB_FIELDS = ["name", "icon", "subtitle", "description", "tags", "tools", "difficulty", "active", "position"];
const LAB_JSON_FIELDS = new Set(["tags", "tools", "difficulty"]);

// Partial update - only touches fields present in `patch`. Only ever
// splices hardcoded column names (from LAB_FIELDS) into the SQL text
// itself, never user input, same pattern as ad_labs' admin edit endpoint.
export async function updateLab(db, id, patch) {
	const sets = [];
	const values = [];
	for (const field of LAB_FIELDS) {
		if (!(field in patch)) continue;
		sets.push(`${field} = ?`);
		values.push(LAB_JSON_FIELDS.has(field) ? JSON.stringify(patch[field]) : patch[field]);
	}
	if (sets.length === 0) return getLab(db, id);
	sets.push("updated_at = CURRENT_TIMESTAMP");
	values.push(id);
	const { meta } = await db.prepare(`UPDATE labs SET ${sets.join(", ")} WHERE id = ?`).bind(...values).run();
	if (!meta.changes) return null;
	return getLab(db, id);
}

export async function deleteLab(db, id) {
	// lab_steps cascade-deletes via the FK's ON DELETE CASCADE (migrations/0001_labs.sql).
	const { meta } = await db.prepare("DELETE FROM labs WHERE id = ?").bind(id).run();
	return !!meta.changes;
}

export async function createStep(db, step) {
	await db
		.prepare(
			`INSERT INTO lab_steps (id, lab_id, position, name, subtitle, header, content)
			 VALUES (?, ?, ?, ?, ?, ?, ?)`
		)
		.bind(step.id, step.labId, step.position, step.name, step.subtitle, step.header ? 1 : 0, step.content)
		.run();
	const row = await db.prepare("SELECT * FROM lab_steps WHERE id = ?").bind(step.id).first();
	return rowToStep(row);
}

const STEP_FIELDS = ["position", "name", "subtitle", "header", "content"];

export async function updateStep(db, id, patch) {
	const sets = [];
	const values = [];
	for (const field of STEP_FIELDS) {
		if (!(field in patch)) continue;
		sets.push(`${field} = ?`);
		values.push(field === "header" ? (patch[field] ? 1 : 0) : patch[field]);
	}
	if (sets.length === 0) {
		const row = await db.prepare("SELECT * FROM lab_steps WHERE id = ?").bind(id).first();
		return row ? rowToStep(row) : null;
	}
	sets.push("updated_at = CURRENT_TIMESTAMP");
	values.push(id);
	const { meta } = await db.prepare(`UPDATE lab_steps SET ${sets.join(", ")} WHERE id = ?`).bind(...values).run();
	if (!meta.changes) return null;
	const row = await db.prepare("SELECT * FROM lab_steps WHERE id = ?").bind(id).first();
	return rowToStep(row);
}

export async function deleteStep(db, id) {
	const { meta } = await db.prepare("DELETE FROM lab_steps WHERE id = ?").bind(id).run();
	return !!meta.changes;
}

// Re-numbers every step of a lab to match `orderedStepIds` (0-indexed) -
// batched so a reorder can't leave two steps sharing a position if one
// statement in the middle failed.
export async function reorderSteps(db, labId, orderedStepIds) {
	const statements = orderedStepIds.map((stepId, index) =>
		db.prepare("UPDATE lab_steps SET position = ? WHERE id = ? AND lab_id = ?").bind(index, stepId, labId)
	);
	await db.batch(statements);
	return listStepsByLabId(db, labId);
}

const { DataTypes } = require("sequelize");
module.exports = (sequelize, Sequelize) => {
    const audit_log = sequelize.define('audit_log', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        actor_id: { type: DataTypes.UUID },        // who performed the action
        actor_name: { type: DataTypes.STRING },
        actor_role: { type: DataTypes.STRING },    // role UUID
        action: { type: DataTypes.STRING },        // created / updated / deleted / renewed / wiped
        entity: { type: DataTypes.STRING },        // consumer / vehicle / user / policy / settings …
        entity_id: { type: DataTypes.STRING },
        summary: { type: DataTypes.TEXT },         // human-readable line
        metadata: { type: DataTypes.TEXT },        // JSON string (optional extra context)
    }, {
        tableName: 'audit_logs',
    });
    return audit_log;
};

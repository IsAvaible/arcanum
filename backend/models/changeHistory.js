'use strict';

module.exports = (sequelize, DataTypes) => {
    const ChangeHistory = sequelize.define(
        'ChangeHistory',
        {
            id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
            },
            case_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'Cases', // Referenzierte Tabelle
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            updatedAt: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
        },
        {
            tableName: 'ChangeHistory',
            timestamps: false, // Deaktiviert Sequelize's automatische Verwaltung von createdAt und updatedAt
        }
    );

    ChangeHistory.associate = function (models) {
        ChangeHistory.belongsTo(models.Cases, {
            foreignKey: 'case_id',
            as: 'case',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        });
    };


    return ChangeHistory;
};

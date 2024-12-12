"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Cases extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Hier kannst du Assoziationen zu anderen Modellen definieren
      Cases.belongsToMany(models.Attachments, {
        through: "CaseAttachments",
        foreignKey: "caseId",
        otherKey: "attachmentId",
        as: "attachments",
      });
    }
  }
  Cases.init(
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      solution: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      assignee: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      case_type: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      priority: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      draft: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Cases",
    },
  );
  return Cases;
};

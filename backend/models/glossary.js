"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Glossary extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Glossary.belongsToMany(models.Attachments, {
        through: "GlossaryAttachments",
        as: "relatedAttachments",
        foreignKey: "glossaryId",
        otherKey: "attachmentId",
      });

      Glossary.belongsToMany(models.Cases, {
        through: "GlossaryCases",
        as: "relatedCases",
        foreignKey: "glossaryId",
        otherKey: "caseId",
      });
    }
  }
  Glossary.init(
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      term: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      usageCount: {
        type: DataTypes.INTEGER,
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
      modelName: "Glossary",
    },
  );
  return Glossary;
};

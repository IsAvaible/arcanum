"use strict";

const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Attachments extends Model {
    static associate(models) {
      // Viele-zu-Viele Beziehung zu Cases
      Attachments.belongsToMany(models.Cases, {
        through: "CaseAttachments",
        foreignKey: "attachmentId",
        otherKey: "caseId",
        as: "cases",
      });
      // Attachment kann zu mehreren Glossar-Einträgen gehören (n:m)
      Attachments.belongsToMany(models.Glossary, {
        through: 'GlossaryAttachments',
        foreignKey: 'attachmentId',
        otherKey: 'glossaryId',
        as: 'glossary'
      });
    }
  }

  Attachments.init(
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      filename: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      filepath: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      mimetype: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      size: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      uploadedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      filehash: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: "Attachments",
    },
  );

  return Attachments;
};

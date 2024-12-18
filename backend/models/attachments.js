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
      charset: 'utf8', /* i add this two ligne here for generate the table with collation  = 'utf8_general_ci' test it and tell me ? */
      collate: 'utf8_general_ci'
    },
  );

  return Attachments;
};

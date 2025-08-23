'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Follow extends Model {
    static associate(models) {
      Follow.belongsTo(models.User, {
        foreignKey: 'follower_id',
        as: 'Follower',
        onDelete: 'CASCADE',
      });

      Follow.belongsTo(models.User, {
        foreignKey: 'following_id',
        as: 'Following',
        onDelete: 'CASCADE',
      });
    }
  }

  Follow.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      follower_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      follower_username: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      following_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      following_username: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: 'Follow',
      tableName: 'follows',
      underscored: true,
      timestamps: false,
    }
  );

  return Follow;
};

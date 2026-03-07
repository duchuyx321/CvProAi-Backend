import {
    Column,
    DataType,
    HasMany,
    Model,
    PrimaryKey,
    Table,
} from 'sequelize-typescript';
import { Cvs } from '~/models';

@Table({ tableName: 'cv_templates', timestamps: true, underscored: true })
export class Cv_templates extends Model<Cv_templates> {
    @PrimaryKey
    @Column({
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        allowNull: false,
    })
    declare id: string;

    @Column({
        type: DataType.STRING(80),
        allowNull: false,
        unique: true,
    })
    code!: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: false,
    })
    name!: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    preview_url?: string;

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    })
    is_premium!: boolean;

    @Column({
        type: DataType.JSONB,
        allowNull: true,
    })
    config?: Record<string, any>;

    @HasMany(() => Cvs)
    cvs?: Cvs[];
}

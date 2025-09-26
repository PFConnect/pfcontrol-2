export interface Flight {
    id: number;
    session_id: string;
    callsign?: string;
    aircraft_type?: string;
    departure?: string;
    arrival?: string;
    route?: string;
    sid?: string;
    runway?: string;
    cleared_fl?: string;
    status?: string;
    remark?: string;
    clearance?: string;
    stand?: string;
    wake_turbulence?: string;
    flight_type?: string;
    rfl?: string;
    squawk?: string;
    cfl?: string;
    created_at?: string;
    updated_at?: string;
}
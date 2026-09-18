"""Passive synthetic drop; no robot actuation, rendering, or sim-to-real claim."""
import json, sys, hashlib, time
from pathlib import Path
from importlib.metadata import version
import mujoco
out=Path(sys.argv[1] if len(sys.argv)>1 else '.rbb/simulation-executed').resolve()
out.mkdir(parents=True,exist_ok=True)
xml='''<mujoco model="passive-synthetic-drop"><option timestep="0.002" gravity="0 0 -9.81"/><worldbody><geom type="plane" size="2 2 .1"/><body pos="0 0 1"><freejoint/><geom type="sphere" size=".1" mass="1"/></body></worldbody></mujoco>'''
model=mujoco.MjModel.from_xml_string(xml); data=mujoco.MjData(model)
samples=[]
for step in range(1,1001):
    mujoco.mj_step(model,data)
    if step % 10 == 0:
        samples.append({'step':step,'simulation_time_seconds':float(data.time),'position_m':list(map(float,data.qpos[:3])),'linear_velocity_m_per_s':list(map(float,data.qvel[:3])),'contacts':int(data.ncon),'source_host_wall_ns':str(time.time_ns()),'source_host_monotonic_ns':str(time.monotonic_ns())})
wire=''.join(json.dumps(s,separators=(',',':'))+'\n' for s in samples)
(out/'samples.ndjson').write_text(wire)
report={'schema':'rbb.simulation.execution.v1','engine':'MuJoCo','version':version('mujoco'),'license':'Apache-2.0','scenario':'passive synthetic sphere drop onto plane','scenario_digest':hashlib.sha256(xml.encode()).hexdigest(),'steps':1000,'timestep_seconds':float(model.opt.timestep),'elapsed_simulation_seconds':float(data.time),'final_height_m':float(data.qpos[2]),'final_vertical_velocity_m_per_s':float(data.qvel[2]),'contacts':int(data.ncon),'status':'live','sim_to_real_assessed':False,'limitations':['No hardware, robot policy, human sensing, or real-world safety assessment.','Measured stability is specific to this synthetic scenario.']}
report['samples']=len(samples);report['samples_digest']=hashlib.sha256(wire.encode()).hexdigest();report['clock_domains']={'source':'MuJoCo elapsed simulation seconds','source_host':'Python time_ns / monotonic_ns; uncalibrated local host'}
assert .09 < report['final_height_m'] < .11 and abs(report['final_vertical_velocity_m_per_s']) < .01 and report['contacts']>0
(out/'scenario.xml').write_text(xml+'\n');(out/'execution.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))

from setuptools import setup

setup(
    name='performer',
    version='0.1',
    description='Performer reporting',
    url='http://github.com/aocenas/performer',
    author='Andrej Ocenas',
    author_email='mr.ocenas@gmail.com',
    license='MIT',
    packages=['performer'],
    install_requires=[
        'requests',
    ],
    keywords=['perf', 'monitoring', 'profiling'],
    zip_safe=False
)

FROM blazemeter/taurus:latest

RUN apt-get update && apt-get install -y \
    iputils-ping \
    vim
RUN pip install --no-cache-dir awscli

WORKDIR /bzt-configs
ADD configs /bzt-configs
RUN ls -lha
RUN mv bzt-rc /root/.bzt-rc
RUN bzt pre-test.yaml
RUN cp /bzt-configs/ext/*.jar /root/.bzt/jmeter-taurus/5.3/lib/ext/
RUN ls -lha /root/.bzt/jmeter-taurus/5.3/lib/ext
ENV PATH="${PATH}:/root/.bzt/jmeter-taurus/5.3/bin/"

RUN mkdir /test_cases
WORKDIR /test_cases
ADD ./load-test.sh /test_cases/
RUN chmod 755 /test_cases/load-test.sh

ENTRYPOINT ["sh", "-c","./load-test.sh"]
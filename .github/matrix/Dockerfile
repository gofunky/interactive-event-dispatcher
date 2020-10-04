FROM mikefarah/yq:3.3.4

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

COPY tests.yml /tests.yml

ENTRYPOINT ["/entrypoint.sh"]
